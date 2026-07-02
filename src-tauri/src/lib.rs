mod audio;
mod commands;
mod galaxy;
mod notes;
mod window;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            commands::list_notes,
            commands::get_note,
            commands::save_note,
            commands::create_note,
            commands::search_notes,
            commands::get_vault_path,
            commands::get_galaxy,
        ])
        .setup(|app| {
            audio::start(app.handle().clone());
            if let Err(e) = window::setup_secondary_monitor(app.handle()) {
                eprintln!("[window] {e}");
            }
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
