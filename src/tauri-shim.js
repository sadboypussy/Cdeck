/** Bridge Tauri API — pas de bundler, withGlobalTauri activé dans tauri.conf. */

export function isTauri() {
  return typeof window.__TAURI__ !== "undefined";
}

export async function invoke(cmd, args = {}) {
  if (!isTauri()) {
    throw new Error(`Hors Tauri — impossible d'appeler "${cmd}"`);
  }
  return window.__TAURI__.core.invoke(cmd, args);
}

export async function listen(event, handler) {
  if (!isTauri()) {
    return () => {};
  }
  return window.__TAURI__.event.listen(event, handler);
}
