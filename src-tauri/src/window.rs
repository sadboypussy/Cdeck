use tauri::{AppHandle, Manager, PhysicalPosition, PhysicalSize};

/// Fenêtre maximisée sur le 2ᵉ moniteur (plein écran fenêtré second écran).
pub fn setup_secondary_monitor(app: &AppHandle) -> Result<(), String> {
    let window = app
        .get_webview_window("main")
        .ok_or_else(|| "Fenêtre principale introuvable".to_string())?;

    let monitors = window
        .available_monitors()
        .map_err(|e| e.to_string())?;

    let monitor = monitors
        .get(1)
        .or_else(|| monitors.first())
        .ok_or_else(|| "Aucun moniteur détecté".to_string())?;

    let pos = monitor.position();
    let size = monitor.size();

    window
        .set_decorations(true)
        .map_err(|e| e.to_string())?;
    window
        .set_resizable(true)
        .map_err(|e| e.to_string())?;
    window
        .set_min_size(None::<PhysicalSize<u32>>)
        .map_err(|e| e.to_string())?;
    window
        .set_max_size(None::<PhysicalSize<u32>>)
        .map_err(|e| e.to_string())?;

    window
        .set_position(PhysicalPosition::new(pos.x, pos.y))
        .map_err(|e| e.to_string())?;
    window
        .set_size(PhysicalSize::new(size.width, size.height))
        .map_err(|e| e.to_string())?;

    window.maximize().map_err(|e| e.to_string())?;
    Ok(())
}
