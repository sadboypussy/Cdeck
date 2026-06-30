import { invoke } from "@tauri-apps/api/core";
import { initAudioReactive, onBands, getRecentEnergy, PEAK_LINK_THRESHOLD, setIntensity, getIntensity } from "./audio-reactive.js";

const DEFAULT_NOTE = "PROTOCOLE_REINITIALISATION";
const YT_PLAYLIST = "PLrAXtmRdnEQy6nuLMH8k8C_4kJ8QqJZQ"; // Syrex-style nightcore playlist

let player = null;
let currentNoteId = null;
let saveTimer = null;
let allNotes = [];
let hudSelected = 0;

const $ = (sel) => document.querySelector(sel);

async function init() {
  setupClock();
  setupTabs();
  setupEditor();
  setupHud();
  setupDebugVu();
  setupPlayer();
  await initAudioReactive();
  applyAudioReactive();

  allNotes = await invoke("list_notes");
  await loadNote(DEFAULT_NOTE);
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

function setupTabs() {
  document.querySelectorAll(".tab").forEach((tab) => {
    tab.addEventListener("click", () => {
      document.querySelectorAll(".tab").forEach((t) => t.classList.remove("active"));
      document.querySelectorAll(".panel").forEach((p) => p.classList.remove("active"));
      tab.classList.add("active");
      $(`#panel-${tab.dataset.tab}`).classList.add("active");
    });
  });
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
  $("#cursor-pos").textContent = `LN ${ln} · COL ${col}`;
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
    await invoke("save_note", { id: currentNoteId, body, tags });
    $("#sync-status").textContent = "SYNC OK";
  } catch {
    $("#sync-status").textContent = "SYNC ERR";
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
    renderRadar(note);
    $("#sync-status").textContent = "SYNC OK";
  } catch (err) {
    console.warn("Note introuvable:", id, err);
  }
}

function renderRadar(note) {
  const nodesG = $("#radar-nodes");
  const linksG = $("#radar-links");
  nodesG.innerHTML = "";
  linksG.innerHTML = "";

  const cx = 150;
  const cy = 150;
  const neighbors = note.neighbors.slice(0, 4);
  const overflow = note.neighbors.length - neighbors.length;
  const overflowEl = $("#radar-overflow");
  if (overflow > 0) {
    overflowEl.textContent = `+${overflow} CTRL+P`;
    overflowEl.classList.remove("hidden");
  } else {
    overflowEl.classList.add("hidden");
  }

  const positions = neighbors.map((_, i) => {
    const angle = (i / neighbors.length) * Math.PI * 2 - Math.PI / 2;
    return {
      x: cx + Math.cos(angle) * 95,
      y: cy + Math.sin(angle) * 95,
    };
  });

  neighbors.forEach((nid, i) => {
    const pos = positions[i];
    const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
    line.setAttribute("x1", cx);
    line.setAttribute("y1", cy);
    line.setAttribute("x2", pos.x);
    line.setAttribute("y2", pos.y);
    line.setAttribute("class", "radar-link");
    linksG.appendChild(line);
  });

  const center = makeNode(note.id, cx, cy, true);
  nodesG.appendChild(center);

  neighbors.forEach((nid, i) => {
    const pos = positions[i];
    const g = makeNode(nid, pos.x, pos.y, false);
    g.addEventListener("click", () => loadNote(nid));
    nodesG.appendChild(g);
  });

  document.querySelectorAll(".radar-ring").forEach((r) => r.classList.add("pulse"));
}

function makeNode(id, x, y, isCenter) {
  const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
  g.setAttribute("class", `radar-node ${isCenter ? "radar-node-center" : "radar-node-neighbor"}`);
  g.setAttribute("transform", `translate(${x}, ${y})`);

  const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
  circle.setAttribute("r", isCenter ? "8" : "6");
  g.appendChild(circle);

  const label = document.createElementNS("http://www.w3.org/2000/svg", "text");
  label.setAttribute("class", "radar-node-label");
  label.setAttribute("text-anchor", "middle");
  label.setAttribute("y", "-12");
  label.textContent = id.replace(/_/g, " ");
  g.appendChild(label);

  if (!isCenter) {
    g.addEventListener("mouseenter", () => {
      const tip = $("#radar-tooltip");
      tip.textContent = id.replace(/_/g, " ");
      tip.classList.add("visible");
    });
    g.addEventListener("mouseleave", () => {
      $("#radar-tooltip").classList.remove("visible");
    });
  }

  return g;
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
      if (sel) {
        loadNote(sel.dataset.id);
        toggleHud(false);
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
    searchHud("");
    input.focus();
  } else {
    hud.classList.add("hidden");
  }
}

async function searchHud(query) {
  const results = query
    ? await invoke("search_notes", { query })
    : allNotes;
  const ul = $("#hud-results");
  ul.innerHTML = results
    .map(
      (n, i) =>
        `<li data-id="${n.id}" class="${i === 0 ? "selected" : ""}">
          ${n.title}
          <span class="hud-id">${n.id}</span>
        </li>`
    )
    .join("");

  ul.querySelectorAll("li").forEach((li) => {
    li.addEventListener("click", () => {
      loadNote(li.dataset.id);
      toggleHud(false);
    });
  });
  hudSelected = 0;
}

function highlightHudItem(items) {
  items.forEach((li, i) => li.classList.toggle("selected", i === hudSelected));
  items[hudSelected]?.scrollIntoView({ block: "nearest" });
}

function setupPlayer() {
  window.onYouTubeIframeAPIReady = () => {
    player = new YT.Player("yt-player", {
      height: "100%",
      width: "100%",
      playerVars: {
        listType: "playlist",
        list: YT_PLAYLIST,
        autoplay: 0,
        controls: 0,
        modestbranding: 1,
        rel: 0,
      },
      events: {
        onStateChange: onPlayerStateChange,
        onReady: () => {
          player.setVolume(parseInt($("#volume").value, 10));
        },
      },
    });
  };

  if (window.YT && window.YT.Player) {
    window.onYouTubeIframeAPIReady();
  }

  $("#btn-play").addEventListener("click", () => {
    if (!player) return;
    const state = player.getPlayerState();
    if (state === YT.PlayerState.PLAYING) {
      player.pauseVideo();
      $("#btn-play").textContent = "▶";
    } else {
      player.playVideo();
      $("#btn-play").textContent = "❚❚";
    }
  });

  $("#btn-next").addEventListener("click", () => player?.nextVideo());
  $("#btn-prev").addEventListener("click", () => player?.previousVideo());

  $("#volume").addEventListener("input", (e) => {
    player?.setVolume(parseInt(e.target.value, 10));
  });
}

function onPlayerStateChange(event) {
  if (event.data === YT.PlayerState.PLAYING) {
    $("#btn-play").textContent = "❚❚";
    const data = player.getVideoData();
    if (data?.title) {
      $("#track-title").textContent = `DATA_STREAM // ${data.title.toUpperCase()}`;
    }
  } else if (event.data === YT.PlayerState.PAUSED) {
    $("#btn-play").textContent = "▶";
  }
}

function applyAudioReactive() {
  const title = $("#track-title");
  title.classList.add("breathe");

  onBands((_bands, silent) => {
    const indicator = $("#reactivity-indicator");
    indicator.classList.toggle("silent", silent);

    const peak = parseFloat(
      getComputedStyle(document.documentElement).getPropertyValue("--peak") || "0"
    );

    document.querySelectorAll(".radar-node-neighbor").forEach((node, i) => {
      node.classList.toggle("peak", peak > PEAK_LINK_THRESHOLD && i % 2 === 0);
    });

    document.querySelectorAll(".md-wikilink").forEach((link) => {
      link.classList.toggle("peak", peak > PEAK_LINK_THRESHOLD);
    });
  });
}

init();
