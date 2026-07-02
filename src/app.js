import { invoke } from "./tauri-shim.js";
import {
  initAudioReactive,
  onBands,
  getRecentEnergy,
  PEAK_LINK_THRESHOLD,
  setIntensity,
  getIntensity,
} from "./audio-reactive.js";
import { createProximityUI } from "./proximity.js";

const DEFAULT_NOTE = "PROTOCOLE_REINITIALISATION";
const YT_VIDEO_IDS = ["ScMzIvxBSi4", "M7lc1UVf-VE"];
const IDLE_MS = 4000;

let ytVideoIndex = 0;
let player = null;
let playerReady = false;
let ytMounting = false;
let currentNoteId = null;
let saveTimer = null;
let allNotes = [];
let hudSelected = 0;
let hudCreateId = null;
let currentNote = null;
let proximityUi = null;
let noteDirty = false;
let posture = "draft";
let readMode = false;
let idleTimer = null;
let acSelected = 0;
let acMatches = [];
let musicSource = "system";
let audioSilent = true;
let lastTrackText = "";

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
  setupPosture();
  setupProximity();
  setupEditor();
  setupReadMode();
  setupHud();
  setupWave();
  setupDebugVu();
  setupMusicBand();
  setupPlayer();

  await initAudioReactive();
  applyAudioReactive();

  try {
    allNotes = await invoke("list_notes");
    await loadNote(DEFAULT_NOTE);
  } catch (e) {
    console.warn("[notes]", e);
    $("#sync-status").textContent = "Vault offline";
  }

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden" && noteDirty && !readMode) {
      clearTimeout(saveTimer);
      saveCurrentNote();
    }
  });
}

function setupClock() {
  const el = $("#music-clock");
  const tick = () => {
    el.textContent = new Date().toLocaleTimeString("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };
  tick();
  setInterval(tick, 30_000);
}

function sanitizeNoteId(raw) {
  return raw.trim().replace(/ /g, "_").replace(/[^\w\-]/g, "");
}

function setPosture(next) {
  posture = next;
  document.body.classList.remove("posture-draft", "posture-navigate", "posture-focus");
  document.body.classList.add(`posture-${next}`);

  const labels = { draft: "Draft", navigate: "Navigate", focus: "Focus" };
  $("#posture-badge").textContent = labels[next] ?? next;

  const overlay = $("#proximity-focus");
  if (next === "focus") {
    overlay.classList.remove("hidden");
  } else {
    overlay.classList.add("hidden");
  }
}

function setupPosture() {
  $("#proximity-focus-backdrop").addEventListener("click", () => setPosture("navigate"));

  document.addEventListener("keydown", (e) => {
    if (!$("#hud").classList.contains("hidden")) return;

    if (e.ctrlKey && e.shiftKey && e.key === "G") {
      e.preventDefault();
      setPosture(posture === "focus" ? "navigate" : "focus");
      return;
    }

    if (e.key === "Escape") {
      const ac = $("#wikilink-ac");
      if (!ac.classList.contains("hidden")) {
        e.preventDefault();
        hideWikilinkAc();
        return;
      }
      if (posture === "focus") {
        e.preventDefault();
        setPosture("navigate");
        return;
      }
      if (posture === "navigate") {
        e.preventDefault();
        setPosture("draft");
        $("#editor")?.focus();
      }
    }
  });
}

function bumpDraft() {
  if (posture === "focus") return;
  setPosture("draft");
  clearTimeout(idleTimer);
  idleTimer = setTimeout(() => {
    if (!readMode && document.activeElement === $("#editor")) {
      setPosture("navigate");
    }
  }, IDLE_MS);
}

function setupWave() {
  const wave = $("#audio-wave");
  wave.innerHTML = "";
  for (let i = 0; i < 14; i++) {
    const bar = document.createElement("i");
    bar.style.height = "18%";
    wave.appendChild(bar);
  }
}

function setupProximity() {
  proximityUi = createProximityUI({
    railLeft: $("#proximity-rail-left"),
    railRight: $("#proximity-rail-right"),
    ribbon: $("#proximity-ribbon"),
    gridContainer: $("#proximity-grid"),
    fadeLeft: $("#proximity-fade-left"),
    fadeRight: $("#proximity-fade-right"),
    onSelect: async (id) => {
      await navigateToNote(id);
      setPosture("draft");
    },
    onCenterClick: () => setPosture("navigate"),
  });

  document.addEventListener("keydown", (e) => {
    if (posture !== "focus") return;
    if (!$("#hud").classList.contains("hidden")) return;
    proximityUi?.handleKey(e);
  });
}

async function loadProximity(id) {
  try {
    const view = await invoke("get_galaxy", { id });
    proximityUi?.render(view);
    const total = view.total ?? view.nodes.length;
    const shown = (view.nodes?.length ?? 0) + (view.peripheral?.length ?? 0);
    $("#proximity-meta").textContent =
      total > shown
        ? `${view.nodes.length} proches · suggestions · Entrée pour ouvrir`
        : `${view.nodes.length} note${view.nodes.length !== 1 ? "s" : ""} liée${view.nodes.length !== 1 ? "s" : ""}`;
  } catch (err) {
    console.warn("[proximity]", err);
    $("#proximity-meta").textContent = "Proximité indisponible";
  }
}

function setupEditor() {
  const editor = $("#editor");
  const backdrop = $("#editor-backdrop");

  editor.addEventListener("input", () => {
    updateCursorPos();
    renderEditorBackdrop();
    markNoteDirty();
    scheduleSave();
    bumpDraft();
    updateWikilinkAutocomplete();
  });

  editor.addEventListener("click", handleWikilinkClick);
  editor.addEventListener("keyup", updateCursorPos);
  editor.addEventListener("scroll", () => {
    backdrop.scrollTop = editor.scrollTop;
    backdrop.scrollLeft = editor.scrollLeft;
  });

  editor.addEventListener("keydown", (e) => {
    const ac = $("#wikilink-ac");
    if (!ac.classList.contains("hidden") && acMatches.length) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        acSelected = Math.min(acSelected + 1, acMatches.length - 1);
        highlightAcItem();
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        acSelected = Math.max(acSelected - 1, 0);
        highlightAcItem();
        return;
      }
      if (e.key === "Enter" || e.key === "Tab") {
        e.preventDefault();
        insertWikilink(acMatches[acSelected]?.id);
        return;
      }
      if (e.key === "Escape") {
        hideWikilinkAc();
        return;
      }
    }

    if (e.key === "Tab" && !e.ctrlKey && !e.shiftKey && !e.altKey) {
      e.preventDefault();
      setPosture("navigate");
    }
  });

  editor.addEventListener("focus", bumpDraft);

  $("#btn-save-note").addEventListener("click", () => {
    clearTimeout(saveTimer);
    saveCurrentNote();
  });

  document.addEventListener("keydown", (e) => {
    if (e.ctrlKey && e.key === "s" && !readMode) {
      e.preventDefault();
      clearTimeout(saveTimer);
      saveCurrentNote();
    }
    if (e.ctrlKey && e.key === "e") {
      e.preventDefault();
      toggleReadMode();
    }
  });
}

function setupReadMode() {
  $("#btn-read-mode").addEventListener("click", toggleReadMode);
  $("#read-view").addEventListener("click", (e) => {
    const btn = e.target.closest("[data-note-id]");
    if (btn) navigateToNote(btn.dataset.noteId);
  });
}

function toggleReadMode() {
  const enterRead = !readMode;
  if (enterRead && noteDirty) {
    clearTimeout(saveTimer);
    saveCurrentNote().then(() => {
      readMode = true;
      document.body.classList.add("read-mode");
      $("#btn-read-mode").textContent = "Écrire";
      renderReadView();
    });
    return;
  }
  readMode = enterRead;
  document.body.classList.toggle("read-mode", readMode);
  $("#btn-read-mode").textContent = readMode ? "Écrire" : "Lire";
  if (readMode) {
    hideWikilinkAc();
    renderReadView();
  } else {
    $("#editor").focus();
  }
}

function markNoteDirty() {
  if (!noteDirty) {
    noteDirty = true;
    updateSaveButton();
    $("#sync-status").textContent = "Modifié";
    $("#sync-status").className = "";
  }
}

function markNoteClean() {
  noteDirty = false;
  updateSaveButton();
}

function updateSaveButton() {
  const btn = $("#btn-save-note");
  btn.disabled = !noteDirty;
  btn.textContent = noteDirty ? "Enregistrer" : "Enregistré";
  btn.classList.toggle("is-saved", !noteDirty);
}

function escapeHtml(text) {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function highlightLine(line) {
  let html = escapeHtml(line);
  html = html.replace(/\[\[([^\]]+)\]\]/g, '<span class="md-wikilink">[[$1]]</span>');
  html = html.replace(/(^|\s)(#[\w\-]+)/g, '$1<span class="md-tag">$2</span>');
  if (line.startsWith("# ")) return `<span class="md-h1">${html}</span>`;
  if (line.startsWith("## ")) return `<span class="md-h2">${html}</span>`;
  return html;
}

function renderEditorBackdrop() {
  const backdrop = $("#editor-backdrop");
  backdrop.innerHTML = $("#editor")
    .value.split("\n")
    .map((line) => highlightLine(line))
    .join("\n");
}

function renderReadView() {
  const body = $("#editor").value;
  const html = body
    .split("\n")
    .map((line) => {
      if (!line.trim()) return "<p>&nbsp;</p>";
      if (line.startsWith("# "))
        return `<h1>${inlineRead(line.slice(2))}</h1>`;
      if (line.startsWith("## "))
        return `<h2>${inlineRead(line.slice(3))}</h2>`;
      return `<p>${inlineRead(line)}</p>`;
    })
    .join("");
  $("#read-view").innerHTML = html;
}

function inlineRead(text) {
  let html = escapeHtml(text);
  html = html.replace(/\[\[([^\]]+)\]\]/g, (_, label) => {
    const id = label.trim().replace(/ /g, "_");
    return `<button type="button" class="read-wikilink" data-note-id="${escapeHtml(id)}">${escapeHtml(label)}</button>`;
  });
  html = html.replace(/#[\w\-]+/g, (tag) => `<span class="read-tag">${tag}</span>`);
  return html;
}

function updateCursorPos() {
  const editor = $("#editor");
  const text = editor.value.substring(0, editor.selectionStart);
  const lines = text.split("\n");
  $("#cursor-pos").textContent = `Ln ${lines.length}, Col ${lines[lines.length - 1].length + 1}`;
}

function scheduleSave() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(saveCurrentNote, 800);
}

async function saveCurrentNote() {
  if (!currentNoteId || readMode) return;
  const body = $("#editor").value;
  const tags = extractTags(body);
  const btn = $("#btn-save-note");
  btn.disabled = true;
  btn.textContent = "…";
  try {
    const note = await invoke("save_note", { id: currentNoteId, body, tags });
    currentNote = note;
    await loadProximity(note.id);
    markNoteClean();
    $("#sync-status").textContent = "Synced";
    $("#sync-status").className = "status-ok";
  } catch {
    markNoteDirty();
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
  $("#tags-bar").innerHTML = tags.map((t) => `<span class="tag">${t}</span>`).join("");
}

function handleWikilinkClick(e) {
  if (readMode) return;
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
      navigateToNote(m[1].trim().replace(/ /g, "_"));
      return;
    }
  }
}

function getWikilinkQuery() {
  const editor = $("#editor");
  const pos = editor.selectionStart;
  const before = editor.value.slice(0, pos);
  const open = before.lastIndexOf("[[");
  if (open === -1) return null;
  if (before.slice(open).includes("]]")) return null;
  return before.slice(open + 2);
}

function updateWikilinkAutocomplete() {
  const query = getWikilinkQuery();
  if (query === null) {
    hideWikilinkAc();
    return;
  }

  const q = query.toLowerCase();
  const neighborIds = new Set(
    (proximityUi?.getLastView?.()?.nodes ?? []).map((n) => n.id)
  );

  acMatches = allNotes
    .filter((n) => n.id.toLowerCase().includes(q) || n.title.toLowerCase().includes(q))
    .sort((a, b) => {
      const aN = neighborIds.has(a.id) ? 0 : 1;
      const bN = neighborIds.has(b.id) ? 0 : 1;
      return aN - bN || a.title.localeCompare(b.title);
    })
    .slice(0, 8);

  if (!acMatches.length && q.length >= 1) {
    const id = sanitizeNoteId(query);
    if (id) acMatches = [{ id, title: id.replace(/_/g, " "), _create: true }];
  }

  if (!acMatches.length) {
    hideWikilinkAc();
    return;
  }

  acSelected = 0;
  const ul = $("#wikilink-ac");
  ul.innerHTML = acMatches
    .map(
      (n, i) =>
        `<li class="${i === 0 ? "selected" : ""}" data-idx="${i}">
          ${n._create ? "Créer" : escapeHtml(n.title)}
          <span class="ac-id">${escapeHtml(n.id)}</span>
        </li>`
    )
    .join("");
  ul.classList.remove("hidden");
  ul.querySelectorAll("li").forEach((li) => {
    li.addEventListener("mousedown", (e) => {
      e.preventDefault();
      insertWikilink(acMatches[parseInt(li.dataset.idx, 10)]?.id);
    });
  });
}

function highlightAcItem() {
  $("#wikilink-ac")
    .querySelectorAll("li")
    .forEach((li, i) => li.classList.toggle("selected", i === acSelected));
}

function hideWikilinkAc() {
  $("#wikilink-ac").classList.add("hidden");
  acMatches = [];
}

async function insertWikilink(id) {
  if (!id) return;
  hideWikilinkAc();
  const editor = $("#editor");
  const pos = editor.selectionStart;
  const before = editor.value.slice(0, pos);
  const open = before.lastIndexOf("[[");
  if (open === -1) return;

  const after = editor.value.slice(pos);
  const insert = `[[${id}]]`;
  editor.value = before.slice(0, open) + insert + after;
  const newPos = open + insert.length;
  editor.setSelectionRange(newPos, newPos);
  editor.focus();

  if (!allNotes.some((n) => n.id === id)) {
    try {
      await invoke("create_note", { id, body: null });
      await refreshNoteList();
    } catch {
      /* note may exist */
    }
  }

  renderEditorBackdrop();
  markNoteDirty();
  scheduleSave();
  bumpDraft();
}

export async function navigateToNote(id) {
  if (!id) return;
  if (noteDirty && !readMode) {
    clearTimeout(saveTimer);
    await saveCurrentNote();
  }
  await loadNote(id);
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
    if (readMode) renderReadView();
    updateCursorPos();
    markNoteClean();
    await loadProximity(note.id);
    setPosture("draft");
    $("#sync-status").textContent = "Synced";
    $("#sync-status").className = "status-ok";
  } catch (err) {
    console.warn("Note introuvable:", id, err);
  }
}

function setTrackTitle(text) {
  const next = String(text).trim();
  if (next === lastTrackText) return;
  lastTrackText = next;
  const marquee = $("#track-marquee");
  const span = $("#track-title");
  const long = next.length > 42;
  marquee.classList.toggle("is-long", long);
  span.textContent = long ? `${next} · ${next}` : next;
}

function applyAudioReactive() {
  const waveBars = $("#audio-wave")?.querySelectorAll("i") ?? [];

  onBands((bands, silent) => {
    audioSilent = silent;
    $("#reactivity-indicator").classList.toggle("silent", silent);

    if (musicSource === "system") {
      setTrackTitle(silent ? "Silence · en attente de musique" : "Musique système · WASAPI");
    }

    waveBars.forEach((bar, i) => {
      const bandIdx = Math.min(bands.length - 1, Math.floor((i / waveBars.length) * bands.length));
      const v = bands[bandIdx] ?? 0;
      const h = Math.round(14 + Math.min(1, v * 1.25) * 86);
      bar.style.height = `${h}%`;
      bar.classList.toggle("lo", h < 20);
    });

    document.querySelectorAll(".md-wikilink").forEach((link) => {
      const peak = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--peak") || "0");
      link.classList.toggle("peak", peak > PEAK_LINK_THRESHOLD);
    });
  });
}

function setupMusicBand() {
  $("#btn-music-collapse").addEventListener("click", () => {
    document.body.classList.toggle("music-collapsed");
    document.body.classList.toggle("music-expanded");
  });

  $("#music-source").addEventListener("change", (e) => {
    musicSource = e.target.value;
    const ytControls = $("#btn-play");
    const vol = $("#volume-wrap");
    if (musicSource === "youtube") {
      ytControls.classList.remove("hidden");
      vol.classList.remove("hidden");
      lastTrackText = "";
      setTrackTitle("YouTube · ▶ pour lancer");
    } else {
      ytControls.classList.add("hidden");
      vol.classList.add("hidden");
      if (ytReady()) player.pauseVideo();
      lastTrackText = "";
      setTrackTitle(audioSilent ? "Silence · en attente de musique" : "Musique système · WASAPI");
    }
  });
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
    await navigateToNote(cleanId);
    toggleHud(false);
  } catch (err) {
    console.warn("Création note:", err);
  }
}

function setupDebugVu() {
  const panel = $("#debug-vu");
  const labels = ["sub", "bas", "lo", "mid", "hi", "pk"];
  $("#debug-vu-bars").innerHTML = labels
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
      if (sel?.dataset.create === "1") createNoteFromHud(sel.dataset.id);
      else if (sel) {
        navigateToNote(sel.dataset.id);
        toggleHud(false);
      } else if (hudCreateId) createNoteFromHud(hudCreateId);
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
    $("#editor")?.focus();
  }
}

async function searchHud(query) {
  const results = query ? await invoke("search_notes", { query }) : allNotes;
  const ul = $("#hud-results");
  const cleanId = sanitizeNoteId(query.trim());
  const exactMatch = results.some((n) => n.id.toLowerCase() === cleanId.toLowerCase());
  hudCreateId = cleanId && !exactMatch ? cleanId : null;

  let html = "";
  if (hudCreateId) {
    html += `<li data-id="${hudCreateId}" data-create="1" class="hud-create selected">
      Créer « ${hudCreateId.replace(/_/g, " ")} »
      <span class="hud-id">Entrée</span></li>`;
  }
  html += results
    .map(
      (n, i) =>
        `<li data-id="${n.id}" class="${!hudCreateId && i === 0 ? "selected" : ""}">
          ${escapeHtml(n.title)}<span class="hud-id">${n.id}</span></li>`
    )
    .join("");
  ul.innerHTML = html;
  ul.querySelectorAll("li").forEach((li) => {
    li.addEventListener("click", () => {
      if (li.dataset.create === "1") createNoteFromHud(li.dataset.id);
      else {
        navigateToNote(li.dataset.id);
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
        if (event.data === 101 || event.data === 150 || event.data === 100) {
          if (ytVideoIndex < YT_VIDEO_IDS.length - 1) {
            ytVideoIndex += 1;
            player.loadVideoById(YT_VIDEO_IDS[ytVideoIndex]);
            return;
          }
          setTrackTitle("YouTube indisponible · WASAPI actif");
          lastTrackText = "";
        }
      },
    },
  });
}

function setupPlayer() {
  $("#btn-play").addEventListener("click", async () => {
    if (musicSource !== "youtube") return;
    if (!player && !ytMounting) {
      await loadYouTubeApi();
      mountPlayer();
      await new Promise((r) => setTimeout(r, 400));
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

  $("#volume").addEventListener("input", (e) => {
    setPlayerVolume(parseInt(e.target.value, 10));
  });
}

function onPlayerStateChange(event) {
  if (!ytReady() || musicSource !== "youtube") return;
  if (event.data === YT.PlayerState.PLAYING) {
    setPlayIcon(true);
    const data = player.getVideoData();
    if (data?.title) setTrackTitle(data.title);
  } else if (event.data === YT.PlayerState.PAUSED) {
    setPlayIcon(false);
  }
}

init().catch((e) => {
  console.error("[init]", e);
  $("#sync-status").textContent = "Init err";
});
