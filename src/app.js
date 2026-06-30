import { invoke } from "./tauri-shim.js";
import { initAudioReactive, onBands, getRecentEnergy, PEAK_LINK_THRESHOLD, setIntensity, getIntensity } from "./audio-reactive.js";
import { startAmbient, setAmbientEnergy } from "./ambient.js";
import { startCrt } from "./crt.js";

const DEFAULT_NOTE = "PROTOCOLE_REINITIALISATION";
const YT_VIDEO_IDS = ["ScMzIvxBSi4", "M7lc1UVf-VE"];
let ytVideoIndex = 0;

let player = null;
let playerReady = false;
let ytMounting = false;
let currentNoteId = null;
let saveTimer = null;
let allNotes = [];
let hudSelected = 0;
let hudCreateId = null;
let crtFx = null;
let currentNote = null;

const $ = (sel) => document.querySelector(sel);

const ICON_PLAY = '<path d="M7 4l13 8-13 8V4z" fill="currentColor" />';
const ICON_PAUSE = '<path d="M6 5h4v14H6V5zm8 0h4v14h-4V5z" fill="currentColor" />';

function setPlayIcon(playing) {
  $("#btn-play").innerHTML = `<svg viewBox="0 0 24 24" fill="none" aria-hidden="true">${playing ? ICON_PAUSE : ICON_PLAY}</svg>`;
}

function ytReady() {
  return playerReady && player && typeof player.getPlayerState === "function";
}

function setPlayerVolume(value) {
  if (ytReady() && typeof player.setVolume === "function") {
    player.setVolume(value);
  }
}

function showVideoFallback() {
  $("#video-fallback")?.classList.remove("hidden");
  $("#yt-player")?.classList.add("hidden");
}

function loadYouTubeApi() {
  return new Promise((resolve) => {
    if (window.YT?.Player) {
      resolve();
      return;
    }
    if (document.querySelector('script[src*="youtube.com/iframe_api"]')) {
      const wait = setInterval(() => {
        if (window.YT?.Player) {
          clearInterval(wait);
          resolve();
        }
      }, 50);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://www.youtube.com/iframe_api";
    document.head.appendChild(script);
    window.onYouTubeIframeAPIReady = () => resolve();
  });
}

async function init() {
  setupClock();
  setupTabs();
  setupEditor();
  setupHud();
  setupWave();
  setupDebugVu();
  setupPlayer();

  try {
    startAmbient($("#ambient-canvas"));
  } catch (e) {
    console.warn("[ambient]", e);
  }

  try {
    crtFx = startCrt($("#crt-canvas"), $(".scanner-frame"));
  } catch (e) {
    console.warn("[crt]", e);
  }

  await initAudioReactive();
  applyAudioReactive();

  try {
    allNotes = await invoke("list_notes");
    await loadNote(DEFAULT_NOTE);
  } catch (e) {
    console.warn("[notes]", e);
    $("#sync-status").textContent = "Vault offline";
  }
}

function setupClock() {
  const el = $("#clock");
  const tick = () => {
    const now = new Date();
    el.textContent = now.toLocaleTimeString("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };
  tick();
  setInterval(tick, 30_000);
}

function sanitizeNoteId(raw) {
  return raw
    .trim()
    .replace(/ /g, "_")
    .replace(/[^\w\-]/g, "");
}

function setupWave() {
  const wave = $("#audio-wave");
  for (let i = 0; i < 14; i++) {
    const bar = document.createElement("i");
    bar.style.height = "18%";
    wave.appendChild(bar);
  }
}

function setupTabs() {
  $("#tab-notes").addEventListener("click", () => switchTab("notes"));
  $("#tab-links").addEventListener("click", () => switchTab("links"));
}

function switchTab(tabName) {
  const isLinks = tabName === "links";

  $("#tab-notes").classList.toggle("active", !isLinks);
  $("#tab-links").classList.toggle("active", isLinks);
  $("#tabs-track").classList.toggle("links-on", isLinks);
  $("#panel-notes").classList.toggle("active", !isLinks);
  $("#panel-links").classList.toggle("active", isLinks);
}

function setupEditor() {
  const editor = $("#editor");
  const backdrop = $("#editor-backdrop");
  editor.addEventListener("input", () => {
    updateCursorPos();
    renderEditorBackdrop();
    scheduleSave();
  });
  editor.addEventListener("click", handleWikilinkClick);
  editor.addEventListener("keyup", updateCursorPos);
  editor.addEventListener("scroll", () => {
    backdrop.scrollTop = editor.scrollTop;
    backdrop.scrollLeft = editor.scrollLeft;
  });
}

function escapeHtml(text) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function highlightLine(line) {
  let html = escapeHtml(line);
  html = html.replace(
    /\[\[([^\]]+)\]\]/g,
    '<span class="md-wikilink">[[$1]]</span>'
  );
  if (line.startsWith("# ")) {
    return `<span class="md-h1">${html}</span>`;
  }
  if (line.startsWith("## ")) {
    return `<span class="md-h2">${html}</span>`;
  }
  return html;
}

function renderEditorBackdrop() {
  const backdrop = $("#editor-backdrop");
  const text = $("#editor").value;
  backdrop.innerHTML = text
    .split("\n")
    .map((line) => highlightLine(line))
    .join("\n");
}

function updateCursorPos() {
  const editor = $("#editor");
  const text = editor.value.substring(0, editor.selectionStart);
  const lines = text.split("\n");
  const ln = lines.length;
  const col = lines[lines.length - 1].length + 1;
  $("#cursor-pos").textContent = `Ln ${ln}, Col ${col}`;
}

function scheduleSave() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(saveCurrentNote, 800);
}

async function saveCurrentNote() {
  if (!currentNoteId) return;
  const body = $("#editor").value;
  const tags = extractTags(body);
  try {
    const note = await invoke("save_note", { id: currentNoteId, body, tags });
    currentNote = note;
    renderLinks(note);
    $("#sync-status").textContent = "Synced";
    $("#sync-status").className = "status-ok";
  } catch {
    $("#sync-status").textContent = "Sync err";
    $("#sync-status").className = "";
  }
}

function extractTags(body) {
  const re = /(^|\s)(#[\w\-]+)/g;
  const tags = [];
  let m;
  while ((m = re.exec(body)) !== null) tags.push(m[2]);
  return [...new Set(tags)];
}

function renderTags(tags) {
  const bar = $("#tags-bar");
  bar.innerHTML = tags.map((t) => `<span class="tag">${t}</span>`).join("");
}

function handleWikilinkClick(e) {
  const editor = $("#editor");
  const pos = editor.selectionStart;
  const text = editor.value;
  const re = /\[\[([^\]]+)\]\]/g;
  let m;
  while ((m = re.exec(text)) !== null) {
    const start = m.index;
    const end = start + m[0].length;
    if (pos >= start && pos <= end) {
      e.preventDefault();
      const id = m[1].trim().replace(/ /g, "_");
      loadNote(id);
      return;
    }
  }
}

export async function loadNote(id) {
  try {
    const note = await invoke("get_note", { id });
    currentNoteId = note.id;
    currentNote = note;
    const editor = $("#editor");
    editor.value = note.body;
    const transitionMs = Math.round(180 + getRecentEnergy() * 320);
    editor.style.setProperty("--note-transition-ms", `${transitionMs}ms`);
    editor.classList.remove("note-transition");
    void editor.offsetWidth;
    editor.classList.add("note-transition");
    setTimeout(() => editor.classList.remove("note-transition"), transitionMs + 50);
    renderTags(note.tags);
    renderEditorBackdrop();
    updateCursorPos();
    renderLinks(note);
    $("#sync-status").textContent = "Synced";
    $("#sync-status").className = "status-ok";
  } catch (err) {
    console.warn("Note introuvable:", id, err);
  }
}

function renderLinks(note) {
  const list = $("#links-list");
  const emptyEl = $("#links-empty");
  const overflowEl = $("#links-overflow");
  const activeTitle = $("#links-active-title");
  const activeId = $("#links-active-id");

  activeTitle.textContent = note.title || note.id.replace(/_/g, " ");
  activeId.textContent = note.id;

  const neighbors = note.neighbors?.slice(0, 4) ?? [];
  const overflow = (note.neighbors?.length ?? 0) - neighbors.length;

  if (neighbors.length === 0) {
    emptyEl.classList.remove("hidden");
    list.innerHTML = "";
  } else {
    emptyEl.classList.add("hidden");
    list.innerHTML = neighbors
      .map((id) => {
        const meta = allNotes.find((n) => n.id === id);
        const label = meta?.title ?? id.replace(/_/g, " ");
        return `<button type="button" class="link-card" data-id="${escapeHtml(id)}">
          <span class="link-card-title">${escapeHtml(label)}</span>
          <span class="link-card-id">${escapeHtml(id)}</span>
        </button>`;
      })
      .join("");

    list.querySelectorAll(".link-card").forEach((btn) => {
      btn.addEventListener("click", () => {
        loadNote(btn.dataset.id);
        switchTab("notes");
      });
    });
  }

  if (overflow > 0) {
    overflowEl.textContent = `+${overflow} autre${overflow > 1 ? "s" : ""} · Ctrl+P pour tout voir`;
    overflowEl.classList.remove("hidden");
  } else {
    overflowEl.classList.add("hidden");
  }
}

async function refreshNoteList() {
  allNotes = await invoke("list_notes");
}

async function createNoteFromHud(id) {
  const cleanId = sanitizeNoteId(id);
  if (!cleanId) return;
  try {
    await invoke("create_note", { id: cleanId, body: null });
    await refreshNoteList();
    await loadNote(cleanId);
    toggleHud(false);
    $("#sync-status").textContent = "Created";
    $("#sync-status").className = "status-ok";
  } catch (err) {
    console.warn("Création note:", err);
    $("#sync-status").textContent = "Create err";
    $("#sync-status").className = "";
  }
}

function setupDebugVu() {
  const panel = $("#debug-vu");
  const labels = ["sub", "bas", "lo", "mid", "hi", "pk"];
  const bars = $("#debug-vu-bars");
  bars.innerHTML = labels
    .map(
      (l) =>
        `<div class="debug-vu-bar" data-band="${l}"><span>${l}</span><span style="--vu:0"></span></div>`
    )
    .join("");

  const toggle = () => panel.classList.toggle("hidden");

  document.addEventListener("keydown", (e) => {
    if (e.ctrlKey && e.shiftKey && e.key === "D") {
      e.preventDefault();
      toggle();
    }
  });
  $("#reactivity-indicator").addEventListener("click", toggle);

  const intensityInput = $("#debug-intensity");
  intensityInput.value = String(Math.round(getIntensity() * 100));
  intensityInput.addEventListener("input", (e) => {
    setIntensity(parseInt(e.target.value, 10) / 100);
  });

  onBands((bandValues) => {
    if (panel.classList.contains("hidden")) return;
    panel.querySelectorAll(".debug-vu-bar").forEach((row, i) => {
      const v = bandValues[i] ?? 0;
      row.querySelector("span:last-child").style.setProperty("--vu", v);
      row.classList.toggle("peak", i === 5 && v > PEAK_LINK_THRESHOLD);
    });
  });
}

function setupHud() {
  const hud = $("#hud");
  const input = $("#hud-input");

  document.addEventListener("keydown", (e) => {
    if (e.ctrlKey && e.key === "p") {
      e.preventDefault();
      toggleHud(true);
    }
    if (e.key === "Escape" && !hud.classList.contains("hidden")) {
      toggleHud(false);
    }
  });

  input.addEventListener("input", () => searchHud(input.value));
  input.addEventListener("keydown", (e) => {
    const items = $("#hud-results").querySelectorAll("li");
    if (e.key === "ArrowDown") {
      e.preventDefault();
      hudSelected = Math.min(hudSelected + 1, items.length - 1);
      highlightHudItem(items);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      hudSelected = Math.max(hudSelected - 1, 0);
      highlightHudItem(items);
    } else if (e.key === "Enter") {
      e.preventDefault();
      const sel = items[hudSelected];
      if (sel?.dataset.create === "1") {
        createNoteFromHud(sel.dataset.id);
      } else if (sel) {
        loadNote(sel.dataset.id);
        toggleHud(false);
      } else if (hudCreateId) {
        createNoteFromHud(hudCreateId);
      }
    }
  });
}

function toggleHud(open) {
  const hud = $("#hud");
  const input = $("#hud-input");
  if (open) {
    hud.classList.remove("hidden");
    input.value = "";
    hudSelected = 0;
    hudCreateId = null;
    searchHud("");
    input.focus();
  } else {
    hud.classList.add("hidden");
  }
}

async function searchHud(query) {
  const results = query ? await invoke("search_notes", { query }) : allNotes;
  const ul = $("#hud-results");
  const q = query.trim();
  const cleanId = sanitizeNoteId(q);
  const exactMatch = results.some((n) => n.id.toLowerCase() === cleanId.toLowerCase());
  hudCreateId = cleanId && !exactMatch ? cleanId : null;

  let html = "";
  if (hudCreateId) {
    html += `<li data-id="${hudCreateId}" data-create="1" class="hud-create selected">
      Créer « ${hudCreateId.replace(/_/g, " ")} »
      <span class="hud-id">nouvelle note · Entrée</span>
    </li>`;
  }

  html += results
    .map(
      (n, i) =>
        `<li data-id="${n.id}" class="${!hudCreateId && i === 0 ? "selected" : ""}">
          ${n.title}
          <span class="hud-id">${n.id}</span>
        </li>`
    )
    .join("");

  ul.innerHTML = html;

  ul.querySelectorAll("li").forEach((li) => {
    li.addEventListener("click", () => {
      if (li.dataset.create === "1") {
        createNoteFromHud(li.dataset.id);
      } else {
        loadNote(li.dataset.id);
        toggleHud(false);
      }
    });
  });
  hudSelected = 0;
}

function highlightHudItem(items) {
  items.forEach((li, i) => li.classList.toggle("selected", i === hudSelected));
  items[hudSelected]?.scrollIntoView({ block: "nearest" });
}

function mountPlayer() {
  if (player || ytMounting) return;
  ytMounting = true;

  player = new YT.Player("yt-player", {
    height: "100%",
    width: "100%",
    videoId: YT_VIDEO_IDS[ytVideoIndex],
    host: "https://www.youtube-nocookie.com",
    playerVars: {
      autoplay: 0,
      controls: 0,
      modestbranding: 1,
      rel: 0,
      playsinline: 1,
      origin: window.location.origin,
      enablejsapi: 1,
    },
    events: {
      onReady: (event) => {
        player = event.target;
        playerReady = true;
        ytMounting = false;
        setPlayerVolume(parseInt($("#volume").value, 10));
      },
      onStateChange: onPlayerStateChange,
      onError: (event) => {
        console.warn("[yt] error", event.data);
        if (event.data === 101 || event.data === 150 || event.data === 100) {
          if (ytVideoIndex < YT_VIDEO_IDS.length - 1) {
            ytVideoIndex += 1;
            playerReady = false;
            player.loadVideoById(YT_VIDEO_IDS[ytVideoIndex]);
            return;
          }
          showVideoFallback();
        }
      },
    },
  });
}

function setupPlayer() {
  $("#btn-play").addEventListener("click", async () => {
    if (!player && !ytMounting) {
      try {
        await loadYouTubeApi();
        mountPlayer();
        await new Promise((r) => setTimeout(r, 400));
      } catch (e) {
        console.warn("[yt]", e);
        showVideoFallback();
        return;
      }
    }
    if (!ytReady()) return;
    const state = player.getPlayerState();
    if (state === YT.PlayerState.PLAYING) {
      player.pauseVideo();
      setPlayIcon(false);
    } else {
      player.playVideo();
      setPlayIcon(true);
    }
  });

  $("#btn-next").addEventListener("click", () => {
    if (ytReady() && typeof player.nextVideo === "function") player.nextVideo();
  });

  $("#btn-prev").addEventListener("click", () => {
    if (ytReady() && typeof player.previousVideo === "function") player.previousVideo();
  });

  $("#volume").addEventListener("input", (e) => {
    setPlayerVolume(parseInt(e.target.value, 10));
  });
}

function onPlayerStateChange(event) {
  if (!ytReady()) return;
  if (event.data === YT.PlayerState.PLAYING) {
    setPlayIcon(true);
    $("#video-fallback")?.classList.add("hidden");
    $("#yt-player")?.classList.remove("hidden");
    const data = player.getVideoData();
    if (data?.title) {
      $("#track-title").textContent = data.title;
      $("#track-sub").textContent = (data.author || "YOUTUBE").toUpperCase();
    }
  } else if (event.data === YT.PlayerState.PAUSED) {
    setPlayIcon(false);
  }
}

function applyAudioReactive() {
  const title = $("#track-title");
  title.classList.add("breathe");
  const waveBars = $("#audio-wave")?.querySelectorAll("i") ?? [];

  onBands((bands, silent) => {
    const indicator = $("#reactivity-indicator");
    indicator.classList.toggle("silent", silent);

    const energy = getRecentEnergy();
    const peak = parseFloat(
      getComputedStyle(document.documentElement).getPropertyValue("--peak") || "0"
    );

    setAmbientEnergy(energy);
    crtFx?.setEnergy(energy);

    waveBars.forEach((bar, i) => {
      const bandIdx = Math.min(bands.length - 1, Math.floor((i / waveBars.length) * bands.length));
      const v = bands[bandIdx] ?? 0;
      const h = Math.round(10 + Math.min(1, v * 1.4) * 90);
      bar.style.height = `${h}%`;
      bar.classList.toggle("lo", h < 24);
    });

    document.querySelectorAll(".md-wikilink").forEach((link) => {
      link.classList.toggle("peak", peak > PEAK_LINK_THRESHOLD);
    });
  });
}

init().catch((e) => {
  console.error("[init]", e);
  $("#sync-status").textContent = "Init err";
});
