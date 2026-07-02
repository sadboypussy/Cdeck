use crate::galaxy::{self, GalaxyView};
use crate::notes::{self, Note, NoteSummary};
use tauri::AppHandle;

#[tauri::command]
pub fn list_notes(app: AppHandle) -> Result<Vec<NoteSummary>, String> {
    let vault = notes::ensure_vault(&app)?;
    notes::list_notes(&vault)
}

#[tauri::command]
pub fn get_note(app: AppHandle, id: String) -> Result<Note, String> {
    let vault = notes::ensure_vault(&app)?;
    notes::get_note(&vault, &id)
}

#[tauri::command]
pub fn save_note(
    app: AppHandle,
    id: String,
    body: String,
    tags: Vec<String>,
) -> Result<Note, String> {
    let vault = notes::ensure_vault(&app)?;
    notes::save_note(&vault, &id, &body, &tags)
}

#[tauri::command]
pub fn create_note(app: AppHandle, id: String, body: Option<String>) -> Result<Note, String> {
    let vault = notes::ensure_vault(&app)?;
    notes::create_note(&vault, &id, body.as_deref())
}

#[tauri::command]
pub fn search_notes(app: AppHandle, query: String) -> Result<Vec<NoteSummary>, String> {
    let vault = notes::ensure_vault(&app)?;
    notes::search_notes(&vault, &query)
}

#[tauri::command]
pub fn get_galaxy(app: AppHandle, id: String) -> Result<GalaxyView, String> {
    let vault = notes::ensure_vault(&app)?;
    galaxy::get_galaxy(&vault, &id)
}

#[tauri::command]
pub fn get_vault_path(app: AppHandle) -> Result<String, String> {
    let vault = notes::ensure_vault(&app)?;
    vault
        .to_str()
        .map(|s| s.to_string())
        .ok_or_else(|| "Chemin vault invalide".to_string())
}
