/** Consommation bandes audio — Rust emit ou fallback simulation. */

const BAND_COUNT = 6;
const SILENCE_THRESHOLD_MS = 2000;

let bands = new Array(BAND_COUNT).fill(0);
let lastActive = Date.now();
let tick = 0;
let intervalId = null;
let usingRust = false;

const listeners = new Set();

export function getBands() {
  return [...bands];
}

export function isSilent() {
  return Date.now() - lastActive > SILENCE_THRESHOLD_MS;
}

export function onBands(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function notifyListeners(silentOverride) {
  const silent =
    silentOverride !== undefined ? silentOverride : isSilent();
  for (const fn of listeners) fn(bands, silent);
}

function applyBands(newBands, silent) {
  bands = newBands.slice(0, BAND_COUNT);
  while (bands.length < BAND_COUNT) bands.push(0);

  const bass = bands[0] ?? 0;
  const mid = ((bands[2] ?? 0) + (bands[3] ?? 0)) / 2;
  const peak = bands[5] ?? 0;
  const energy = (bass + mid + (bands[4] ?? 0)) / 3;

  if (!silent) lastActive = Date.now();

  document.documentElement.style.setProperty("--energy", energy.toFixed(3));
  document.documentElement.style.setProperty("--peak", peak.toFixed(3));
  document.documentElement.style.setProperty(
    "--bass-delta",
    `${(bass * 0.03 * 0.08).toFixed(4)}em`
  );
  document.documentElement.style.setProperty(
    "--bass-glow",
    `${(bass * 6).toFixed(1)}px`
  );

  document.body.classList.toggle("audio-active", !silent);
  document.body.classList.toggle("audio-silent", silent);

  notifyListeners(silent);
}

function simulate() {
  if (usingRust) return;

  tick += 0.05;
  const beat = Math.sin(tick * 2.1);
  const kick = beat > 0.85 ? (beat - 0.85) * 6.5 : 0;
  const bass = 0.25 + Math.abs(Math.sin(tick * 0.7)) * 0.35 + kick * 0.4;
  const mid = 0.15 + Math.abs(Math.sin(tick * 1.3 + 1)) * 0.25;
  const high = 0.1 + Math.abs(Math.sin(tick * 2.8)) * 0.15;
  const peak = kick > 0.3 ? kick : 0;

  applyBands([bass, bass * 0.9, mid, mid * 0.8, high, peak], false);
}

export function startSimulation() {
  if (intervalId || usingRust) return;
  intervalId = setInterval(simulate, 33);
}

export function stopSimulation() {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }
}

export async function connectTauriAudio() {
  try {
    const { listen } = await import("@tauri-apps/api/event");
    await listen("audio-bands", ({ payload }) => {
      usingRust = true;
      stopSimulation();
      applyBands(payload.bands, payload.silent);
    });
    return true;
  } catch {
    return false;
  }
}

export async function initAudioReactive() {
  const connected = await connectTauriAudio();
  if (!connected) startSimulation();
}
