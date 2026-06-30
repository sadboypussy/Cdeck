use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::mpsc;
use std::thread;
use std::time::Duration;
use wasapi::{get_default_device, Direction};

const POLL_INTERVAL_MS: u64 = 1500;

pub fn default_render_device_id() -> Result<String, String> {
    get_default_device(&Direction::Render)
        .map_err(|e| e.to_string())?
        .get_id()
        .map_err(|e| e.to_string())
}

/// Poll le périphérique de sortie par défaut ; envoie un signal si l'ID change (A.5).
pub fn watch_default_device(stop: &AtomicBool, notify: mpsc::Sender<()>) {
    let Ok(initial) = default_render_device_id() else {
        return;
    };
    let last_id = initial;

    while !stop.load(Ordering::Relaxed) {
        thread::sleep(Duration::from_millis(POLL_INTERVAL_MS));
        if stop.load(Ordering::Relaxed) {
            break;
        }
        let Ok(id) = default_render_device_id() else {
            continue;
        };
        if id != last_id {
            let _ = notify.send(());
            break;
        }
    }
}
