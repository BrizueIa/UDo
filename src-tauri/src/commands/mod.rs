use tauri::{AppHandle, Manager};
use crate::models::{FolderItem, InitialData, NoteItem, SubjectItem};
use crate::db::DatabaseManager;

#[tauri::command]
pub fn get_initial_data() -> Result<InitialData, String> {
    let db = DatabaseManager::new().map_err(|e| e.to_string())?;
    db.get_initial_data().map_err(|e| e.to_string())
}

#[tauri::command]
pub fn save_note(note: NoteItem) -> Result<NoteItem, String> {
    let db = DatabaseManager::new().map_err(|e| e.to_string())?;
    db.save_note(&note).map_err(|e| e.to_string())?;
    Ok(note)
}

#[tauri::command]
pub fn delete_note(id: String) -> Result<(), String> {
    let db = DatabaseManager::new().map_err(|e| e.to_string())?;
    db.delete_note(&id).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn save_subject(subject: SubjectItem) -> Result<SubjectItem, String> {
    let db = DatabaseManager::new().map_err(|e| e.to_string())?;
    db.save_subject(&subject).map_err(|e| e.to_string())?;
    Ok(subject)
}

#[tauri::command]
pub fn save_folder(folder: FolderItem) -> Result<FolderItem, String> {
    let db = DatabaseManager::new().map_err(|e| e.to_string())?;
    db.save_folder(&folder).map_err(|e| e.to_string())?;
    Ok(folder)
}

#[tauri::command]
pub fn toggle_widget_mode(app: AppHandle, is_mini: bool) -> Result<(), String> {
    if let Some(window) = app.get_webview_window("main") {
        if is_mini {
            window.set_always_on_top(true).ok();
            window.set_size(tauri::Size::Logical(tauri::LogicalSize { width: 360.0, height: 280.0 })).ok();
        } else {
            window.set_always_on_top(false).ok();
            window.set_size(tauri::Size::Logical(tauri::LogicalSize { width: 1180.0, height: 760.0 })).ok();
        }
    }
    Ok(())
}
