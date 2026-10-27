use tauri::State;
use crate::models::{FolderItem, InitialData, NoteItem, SubjectItem};
use crate::db::DatabaseManager;

#[tauri::command]
pub fn get_initial_data(db: State<'_, DatabaseManager>) -> Result<InitialData, String> {
    db.get_initial_data().map_err(|e| e.to_string())
}

#[tauri::command]
pub fn save_note(db: State<'_, DatabaseManager>, note: NoteItem) -> Result<NoteItem, String> {
    db.save_note(&note).map_err(|e| e.to_string())?;
    Ok(note)
}

#[tauri::command]
pub fn delete_note(db: State<'_, DatabaseManager>, id: String) -> Result<(), String> {
    db.delete_note(&id).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn save_subject(db: State<'_, DatabaseManager>, subject: SubjectItem) -> Result<SubjectItem, String> {
    db.save_subject(&subject).map_err(|e| e.to_string())?;
    Ok(subject)
}

#[tauri::command]
pub fn delete_subject(db: State<'_, DatabaseManager>, id: String) -> Result<(), String> {
    db.delete_subject(&id).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn save_folder(db: State<'_, DatabaseManager>, folder: FolderItem) -> Result<FolderItem, String> {
    db.save_folder(&folder).map_err(|e| e.to_string())?;
    Ok(folder)
}

#[tauri::command]
pub fn delete_folder(db: State<'_, DatabaseManager>, id: String) -> Result<(), String> {
    db.delete_folder(&id).map_err(|e| e.to_string())
}
