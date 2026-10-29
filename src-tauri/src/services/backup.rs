use std::fs;
use std::path::{Path, PathBuf};
use tauri::State;
use rusqlite::params;
use crate::db::DatabaseManager;
use crate::models::{BackupInfo, InitialData};

fn get_backups_dir() -> PathBuf {
    let mut data_dir = dirs::data_local_dir().unwrap_or_else(|| PathBuf::from("."));
    data_dir.push("udo");
    data_dir.push("backups");
    data_dir
}

pub fn perform_daily_auto_backup(db: &DatabaseManager) -> Result<(), String> {
    let backups_dir = get_backups_dir();
    fs::create_dir_all(&backups_dir).map_err(|e| e.to_string())?;

    let today = chrono::Local::now().format("%Y-%m-%d").to_string();
    let backup_file = backups_dir.join(format!("udo-backup-{}.json", today));

    if !backup_file.exists() {
        let initial_data = db.get_initial_data().map_err(|e| e.to_string())?;
        let json_data = serde_json::to_string_pretty(&initial_data).map_err(|e| e.to_string())?;
        fs::write(&backup_file, json_data).map_err(|e| e.to_string())?;
    }

    // Retain only the last 14 backups
    if let Ok(entries) = fs::read_dir(&backups_dir) {
        let mut files: Vec<PathBuf> = entries
            .filter_map(|e| e.ok())
            .map(|e| e.path())
            .filter(|p| {
                p.extension().and_then(|ext| ext.to_str()) == Some("json")
                    && p.file_name()
                        .and_then(|n| n.to_str())
                        .map(|s| s.starts_with("udo-backup-"))
                        .unwrap_or(false)
            })
            .collect();

        files.sort_by(|a, b| b.file_name().cmp(&a.file_name()));

        if files.len() > 14 {
            for old_file in files.iter().skip(14) {
                let _ = fs::remove_file(old_file);
            }
        }
    }

    Ok(())
}

#[tauri::command]
pub fn list_auto_backups() -> Result<Vec<BackupInfo>, String> {
    let backups_dir = get_backups_dir();
    if !backups_dir.exists() {
        return Ok(Vec::new());
    }

    let mut result = Vec::new();
    let entries = fs::read_dir(&backups_dir).map_err(|e| e.to_string())?;
    for entry in entries.filter_map(|e| e.ok()) {
        let path = entry.path();
        if path.is_file() && path.extension().and_then(|ext| ext.to_str()) == Some("json") {
            let metadata = fs::metadata(&path).map_err(|e| e.to_string())?;
            let filename = path.file_name().unwrap_or_default().to_string_lossy().to_string();
            let size_bytes = metadata.len();
            let created_at = if let Ok(modified) = metadata.modified() {
                chrono::DateTime::<chrono::Local>::from(modified)
                    .format("%Y-%m-%d %H:%M:%S")
                    .to_string()
            } else {
                filename.clone()
            };

            result.push(BackupInfo {
                filename,
                path: path.to_string_lossy().to_string(),
                size_bytes,
                created_at,
            });
        }
    }

    result.sort_by(|a, b| b.filename.cmp(&a.filename));
    Ok(result)
}

#[tauri::command]
pub fn export_workspace_json(
    db: State<'_, DatabaseManager>,
    target_path: String,
) -> Result<(), String> {
    let initial_data = db.get_initial_data().map_err(|e| e.to_string())?;
    let json_data = serde_json::to_string_pretty(&initial_data).map_err(|e| e.to_string())?;
    fs::write(Path::new(&target_path), json_data).map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn import_workspace_json(
    db: State<'_, DatabaseManager>,
    source_path: String,
) -> Result<InitialData, String> {
    let raw = fs::read_to_string(Path::new(&source_path)).map_err(|e| e.to_string())?;
    let data: InitialData = serde_json::from_str(&raw).map_err(|e| format!("Invalid JSON format: {}", e))?;

    let mut conn = db.get_connection().map_err(|e| e.to_string())?;
    let tx = conn.transaction().map_err(|e| e.to_string())?;

    tx.execute("DELETE FROM notes", []).map_err(|e| e.to_string())?;
    tx.execute("DELETE FROM folders", []).map_err(|e| e.to_string())?;
    tx.execute("DELETE FROM subjects", []).map_err(|e| e.to_string())?;

    for sub in &data.subjects {
        tx.execute(
            "INSERT INTO subjects (id, name, color, icon, sort_order, is_private)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
            params![sub.id, sub.name, sub.color, sub.icon, sub.order, if sub.is_private { 1 } else { 0 }],
        )
        .map_err(|e| e.to_string())?;
    }

    for fold in &data.folders {
        tx.execute(
            "INSERT INTO folders (id, subject_id, name, is_expanded, sort_order)
             VALUES (?1, ?2, ?3, ?4, ?5)",
            params![fold.id, fold.subject_id, fold.name, if fold.is_expanded { 1 } else { 0 }, fold.order],
        )
        .map_err(|e| e.to_string())?;
    }

    for note in &data.notes {
        let tags_json = serde_json::to_string(&note.tags).unwrap_or_else(|_| "[]".to_string());
        let links_json = serde_json::to_string(&note.links).unwrap_or_else(|_| "[]".to_string());
        let sketches_json = serde_json::to_string(&note.sketches).unwrap_or_else(|_| "[]".to_string());
        let attachments_json = serde_json::to_string(&note.attachments).unwrap_or_else(|_| "[]".to_string());

        let folder_id_param: Option<&str> = if note.folder_id.trim().is_empty() {
            None
        } else {
            Some(note.folder_id.as_str())
        };

        tx.execute(
            "INSERT INTO notes (id, folder_id, subject_id, title, content, is_completed, is_pinned,
                                tags_json, links_json, sketches_json, attachments_json,
                                created_at, updated_at, due_date, focus_minutes, sort_order, is_deleted)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14, ?15, ?16, 0)",
            params![
                note.id, folder_id_param, note.subject_id, note.title, note.content,
                if note.is_completed { 1 } else { 0 },
                if note.is_pinned { 1 } else { 0 },
                tags_json, links_json, sketches_json, attachments_json,
                note.created_at, note.updated_at, note.due_date, note.focus_minutes,
                note.order.unwrap_or(0)
            ],
        )
        .map_err(|e| e.to_string())?;
    }

    tx.commit().map_err(|e| e.to_string())?;
    Ok(data)
}

fn get_linux_autostart_path() -> Option<PathBuf> {
    let config_dir = dirs::config_dir()?;
    Some(config_dir.join("autostart").join("udo.desktop"))
}

#[tauri::command]
pub fn is_autostart_enabled() -> Result<bool, String> {
    #[cfg(target_os = "linux")]
    {
        if let Some(path) = get_linux_autostart_path() {
            return Ok(path.exists());
        }
    }
    Ok(false)
}

#[tauri::command]
pub fn set_autostart_enabled(enabled: bool) -> Result<bool, String> {
    #[cfg(target_os = "linux")]
    {
        if let Some(path) = get_linux_autostart_path() {
            if enabled {
                if let Some(parent) = path.parent() {
                    fs::create_dir_all(parent).map_err(|e| e.to_string())?;
                }
                let exe_path = std::env::current_exe().map_err(|e| e.to_string())?;
                let content = format!(
                    "[Desktop Entry]\nType=Application\nName=UDo\nComment=The way u do. Local-first notes and project organizer\nExec={}\nIcon=udo\nTerminal=false\nCategories=Utility;Office;\n",
                    exe_path.to_string_lossy()
                );
                fs::write(&path, content).map_err(|e| e.to_string())?;
            } else if path.exists() {
                fs::remove_file(&path).map_err(|e| e.to_string())?;
            }
            return Ok(enabled);
        }
    }
    Ok(enabled)
}
