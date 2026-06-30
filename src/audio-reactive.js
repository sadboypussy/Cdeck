/** Consommation bandes audio — Rust emit ou fallback simulation. */

import { listen } from "./tauri-shim.js";

const BAND_COUNT = 6;
const SILENCE_THRESHOLD_MS = 2000;
const MAX_VISUAL_AMPLITUDE = 0.03;
const PEAK_LINK_THRESHOLD = 0.25;
const INTENSITY_KEY = "cyber-deck-intensity";
const RUST_MIN_ENERGY = 0.025;

let intensity = loadIntensity();

let bands = new Array(BAND_COUNT).fill(0);
let smoothedVisual = { energy: 0, bass: 0, peak: 0 };
let recentEnergy = 0;
let lastActive = Date.now();
let tick = 0;
let intervalId = null;
let rustPayload = null;

const listeners = new Set();

function loadIntensity() {
  try {
    const v = parseInt(localStorage.getItem(INTENSITY_KEY) ?? "100", 10);
    return Number.isFinite(v) ? v / 100 : 1;
  } catch {
    return 1;
  }
}

export function setIntensity(factor) {
  intensity = Math.max(0.25, Math.min(2, factor));
  try {
    localStorage.setItem(INTENSITY_KEY, String(Math.round(intensity * 100)));
  } catch {
    /* Tracking Prevention / private mode */
  }
  document.documentElement.style.setProperty("--intensity", intensity.toFixed(2));
}

export function getIntensity() {
  return intensity;
}

document.documentElement.style.setProperty("--intensity", intensity.toFixed(2));

export function getBands() {
  return [...bands];
}

export function getRecentEnergy() {
  return recentEnergy;
}

export function isSilent() {
  return Date.now() - lastActive > SILENCE_THRESHOLD_MS;
}

export function onBands(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function notifyListeners(silent) {
  for (const fn of listeners) fn(bands, silent);
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function applyVisuals(bass, energy, peak, silent) {
  const targetBass = silent ? 0 : bass;
  const targetEnergy = silent ? 0 : energy;
  const targetPeak = silent ? 0 : peak;
  const decay = silent ? 0.06 : 0.35;

  smoothedVisual.bass = lerp(smoothedVisual.bass, targetBass, decay);
  smoothedVisual.energy = lerp(smoothedVisual.energy, targetEnergy, decay);
  smoothedVisual.peak = lerp(smoothedVisual.peak, targetPeak, silent ? 0.12 : 0.5);

  recentEnergy = smoothedVisual.energy;

  document.documentElement.style.setProperty("--energy", smoothedVisual.energy.toFixed(3));
  document.documentElement.style.setProperty("--peak", smoothedVisual.peak.toFixed(3));
  document.documentElement.style.setProperty(
    "--bass-delta",
    `${(smoothedVisual.bass * MAX_VISUAL_AMPLITUDE * intensity * 0.08).toFixed(4)}em`
  );
  document.documentElement.style.setProperty(
    "--bass-glow",
    `${(smoothedVisual.bass * MAX_VISUAL_AMPLITUDE * intensity * 200).toFixed(1)}px`
  );

  document.body.classList.toggle("audio-active", !silent && smoothedVisual.energy > 0.02);
  document.body.classList.toggle("audio-silent", silent || smoothedVisual.energy <= 0.02);
}

function applyBands(newBands, silent, energyFromRust) {
  bands = newBands.slice(0, BAND_COUNT);
  while (bands.length < BAND_COUNT) bands.push(0);

  const bass = bands[0] ?? 0;
  const mid = ((bands[2] ?? 0) + (bands[3] ?? 0)) / 2;
  const peak = bands[5] ?? 0;
  const energy = energyFromRust ?? (bass + mid + (bands[4] ?? 0)) / 3;

  if (!silent && energy > 0.02) lastActive = Date.now();
  applyVisuals(bass, energy, peak, silent);
  notifyListeners(silent);
}

function simulate() {
  if (rustPayload) {
    const e = rustPayload.energy ?? 0;
    if (e > RUST_MIN_ENERGY && !rustPayload.silent) {
      applyBands(rustPayload.bands, rustPayload.silent, rustPayload.energy);
      return;
    }
  }

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
  if (intervalId) return;
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
    await listen("audio-bands", ({ payload }) => {
      rustPayload = payload;
    });
    return true;
  } catch {
    return false;
  }
}

export async function initAudioReactive() {
  startSimulation();
  await connectTauriAudio();
}

startSimulation();

export { PEAK_LINK_THRESHOLD };
