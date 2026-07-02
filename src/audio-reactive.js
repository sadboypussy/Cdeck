/** Consommation bandes audio — rAF 60 fps, attaque rapide / release doux. */

import { listen } from "./tauri-shim.js";

const BAND_COUNT = 6;
const SILENCE_THRESHOLD_MS = 2200;
const MAX_VISUAL_AMPLITUDE = 0.035;
const PEAK_LINK_THRESHOLD = 0.28;
const INTENSITY_KEY = "cyber-deck-intensity";

const BAND_ATTACK = 0.62;
const BAND_RELEASE = 0.16;
const VISUAL_ATTACK = 0.5;
const VISUAL_RELEASE = 0.12;
const PEAK_ATTACK = 0.78;
const PEAK_RELEASE = 0.2;

let intensity = loadIntensity();

const target = {
  bands: new Array(BAND_COUNT).fill(0),
  energy: 0,
  silent: true,
};

let displayBands = new Array(BAND_COUNT).fill(0);
let smoothedVisual = { energy: 0, bass: 0, peak: 0 };
let recentEnergy = 0;
let lastActive = Date.now();
let simTick = 0;
let rafId = null;
let rustConnected = false;

const listeners = new Set();

function loadIntensity() {
  try {
    const v = parseInt(localStorage.getItem(INTENSITY_KEY) ?? "60", 10);
    return Number.isFinite(v) ? v / 100 : 0.6;
  } catch {
    return 0.6;
  }
}

export function setIntensity(factor) {
  intensity = Math.max(0.2, Math.min(1.5, factor));
  try {
    localStorage.setItem(INTENSITY_KEY, String(Math.round(intensity * 100)));
  } catch {
    /* private mode */
  }
  document.documentElement.style.setProperty("--intensity", intensity.toFixed(2));
}

export function getIntensity() {
  return intensity;
}

document.documentElement.style.setProperty("--intensity", intensity.toFixed(2));

export function getBands() {
  return [...displayBands];
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
  for (const fn of listeners) fn(displayBands, silent);
}

function asymmetric(current, goal, attack, release) {
  const rate = goal > current ? attack : release;
  return current + (goal - current) * rate;
}

function applyVisuals(silent) {
  document.documentElement.style.setProperty("--energy", smoothedVisual.energy.toFixed(3));
  document.documentElement.style.setProperty("--peak", smoothedVisual.peak.toFixed(3));
  document.documentElement.style.setProperty(
    "--bass-delta",
    `${(smoothedVisual.bass * MAX_VISUAL_AMPLITUDE * intensity * 0.07).toFixed(4)}em`
  );
  document.documentElement.style.setProperty(
    "--bass-glow",
    `${(smoothedVisual.bass * MAX_VISUAL_AMPLITUDE * intensity * 160).toFixed(1)}px`
  );

  document.body.classList.toggle("audio-active", !silent && smoothedVisual.energy > 0.025);
  document.body.classList.toggle("audio-silent", silent || smoothedVisual.energy <= 0.025);
}

function simulateTargets() {
  simTick += 0.028;
  const beat = Math.sin(simTick * 2.0);
  const kick = beat > 0.82 ? (beat - 0.82) * 5.5 : 0;
  const bass = 0.1 + Math.abs(Math.sin(simTick * 0.65)) * 0.2 + kick * 0.35;
  const mid = 0.07 + Math.abs(Math.sin(simTick * 1.05)) * 0.14;
  const high = 0.04 + Math.abs(Math.sin(simTick * 2.0)) * 0.1;
  const peak = kick > 0.25 ? kick * 0.75 : 0;

  target.bands = [bass, bass * 0.88, mid, mid * 0.8, high, peak];
  target.energy = (bass + mid + high) / 3;
  target.silent = false;
}

function frame() {
  if (!rustConnected) simulateTargets();

  for (let i = 0; i < BAND_COUNT; i++) {
    const goal = target.silent ? 0 : Math.max(0, (target.bands[i] ?? 0) - 0.01);
    displayBands[i] = asymmetric(displayBands[i], goal, BAND_ATTACK, BAND_RELEASE);
  }

  const bass = displayBands[0] ?? 0;
  const mid = ((displayBands[2] ?? 0) + (displayBands[3] ?? 0)) / 2;
  const peakBand = displayBands[5] ?? 0;
  const energyGoal = target.silent
    ? 0
    : Math.max(target.energy ?? 0, (bass + mid + (displayBands[4] ?? 0)) / 3) * intensity;

  if (energyGoal > 0.025) lastActive = Date.now();

  smoothedVisual.bass = asymmetric(
    smoothedVisual.bass,
    target.silent ? 0 : bass,
    VISUAL_ATTACK,
    VISUAL_RELEASE
  );
  smoothedVisual.energy = asymmetric(
    smoothedVisual.energy,
    energyGoal,
    VISUAL_ATTACK,
    VISUAL_RELEASE
  );
  smoothedVisual.peak = asymmetric(
    smoothedVisual.peak,
    target.silent ? 0 : peakBand,
    PEAK_ATTACK,
    PEAK_RELEASE
  );

  recentEnergy = smoothedVisual.energy;

  const silent = isSilent() || (target.silent && smoothedVisual.energy < 0.02);
  applyVisuals(silent);
  notifyListeners(silent);

  rafId = requestAnimationFrame(frame);
}

function startLoop() {
  if (rafId) return;
  rafId = requestAnimationFrame(frame);
}

function stopLoop() {
  if (rafId) {
    cancelAnimationFrame(rafId);
    rafId = null;
  }
}

export async function connectTauriAudio() {
  try {
    await listen("audio-bands", ({ payload }) => {
      rustConnected = true;
      const bands = payload.bands ?? [];
      for (let i = 0; i < BAND_COUNT; i++) {
        target.bands[i] = bands[i] ?? 0;
      }
      target.energy = payload.energy ?? 0;
      target.silent = Boolean(payload.silent);
    });
    return true;
  } catch {
    return false;
  }
}

export async function initAudioReactive() {
  startLoop();
  await connectTauriAudio();
}

export function startSimulation() {
  startLoop();
}

export function stopSimulation() {
  stopLoop();
}

export { PEAK_LINK_THRESHOLD };
