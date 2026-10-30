use tauri::State;
use crate::models::{FolderItem, InitialData, NoteItem, SubjectItem};
use crate::db::DatabaseManager;

#[tauri::command]
pub fn get_initial_data(db: State<'_, DatabaseManager>) -> Result<InitialData, String> {
    db.get_initial_data().map_err(|e| e.to_string())
}

#[tauri::command]
pub fn search_notes(
    db: State<'_, DatabaseManager>,
    query: String,
    include_private: Option<bool>,
) -> Result<Vec<NoteItem>, String> {
    db.search_notes(&query, include_private.unwrap_or(false))
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn save_note(db: State<'_, DatabaseManager>, note: NoteItem) -> Result<(), String> {
    db.save_note(&note).map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn delete_note(db: State<'_, DatabaseManager>, id: String) -> Result<(), String> {
    db.delete_note(&id).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn get_deleted_notes(
    db: State<'_, DatabaseManager>,
    include_private: Option<bool>,
) -> Result<Vec<NoteItem>, String> {
    db.get_deleted_notes(include_private.unwrap_or(false))
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn restore_note(db: State<'_, DatabaseManager>, id: String) -> Result<(), String> {
    db.restore_note(&id).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn restore_notes_batch(db: State<'_, DatabaseManager>, ids: Vec<String>) -> Result<(), String> {
    db.restore_notes_batch(&ids).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn permanently_delete_notes(db: State<'_, DatabaseManager>, ids: Vec<String>) -> Result<(), String> {
    db.permanently_delete_notes(&ids).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn empty_trash(
    db: State<'_, DatabaseManager>,
    include_private: Option<bool>,
) -> Result<(), String> {
    db.empty_trash(include_private.unwrap_or(false))
        .map_err(|e| e.to_string())
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

fn extract_image_path(line: &str) -> Option<String> {
    let trimmed = line.trim();
    if trimmed.is_empty() || trimmed.starts_with("copy") || trimmed.starts_with("cut") {
        return None;
    }
    let without_prefix = trimmed.strip_prefix("file://").unwrap_or(trimmed);
    let decoded = percent_encoding::percent_decode_str(without_prefix)
        .decode_utf8()
        .ok()?;
    let path = std::path::Path::new(decoded.as_ref());
    if let Some(ext) = path.extension().and_then(|e| e.to_str()) {
        let ext_lower = ext.to_lowercase();
        if ["png", "jpg", "jpeg", "webp", "gif", "svg", "bmp"].contains(&ext_lower.as_str())
            && path.exists()
        {
            return Some(decoded.to_string());
        }
    }
    None
}

#[cfg(target_os = "linux")]
fn get_linux_wayland_clipboard_image() -> Option<String> {
    if std::env::var_os("WAYLAND_DISPLAY").is_some() {
        for mime in &["image/png", "image/jpeg", "image/webp"] {
            if let Ok(output) = std::process::Command::new("wl-paste")
                .args(["--type", mime, "--no-newline"])
                .output()
            {
                if output.status.success() && !output.stdout.is_empty() {
                    use base64::{engine::general_purpose, Engine as _};
                    let b64 = general_purpose::STANDARD.encode(&output.stdout);
                    return Some(format!("data:{};base64,{}", mime, b64));
                }
            }
        }
    }
    None
}

#[tauri::command]
pub fn get_clipboard_image() -> Result<Option<String>, String> {
    // 1. Try arboard native clipboard image buffer
    if let Ok(mut clipboard) = arboard::Clipboard::new() {
        if let Ok(img) = clipboard.get_image() {
            use image::{ImageBuffer, Rgba};
            let width = img.width as u32;
            let height = img.height as u32;
            if let Some(buffer) = ImageBuffer::<Rgba<u8>, _>::from_raw(width, height, img.bytes.into_owned()) {
                let mut png_bytes = Vec::new();
                let mut cursor = std::io::Cursor::new(&mut png_bytes);
                if buffer.write_to(&mut cursor, image::ImageFormat::Png).is_ok() {
                    use base64::{engine::general_purpose, Engine as _};
                    let b64 = general_purpose::STANDARD.encode(&png_bytes);
                    return Ok(Some(format!("data:image/png;base64,{}", b64)));
                }
            }
        }

        // 2. Try file path in clipboard text via arboard
        if let Ok(text) = clipboard.get_text() {
            for line in text.lines() {
                if let Some(path) = extract_image_path(line) {
                    if let Ok(data_url) = read_image_as_data_url(path) {
                        return Ok(Some(data_url));
                    }
                }
            }
        }
    }

    // 3. Linux Wayland fallback via wl-paste
    #[cfg(target_os = "linux")]
    if let Some(data_url) = get_linux_wayland_clipboard_image() {
        return Ok(Some(data_url));
    }

    // 4. Linux Wayland text fallback via wl-paste
    #[cfg(target_os = "linux")]
    if std::env::var_os("WAYLAND_DISPLAY").is_some() {
        if let Ok(output) = std::process::Command::new("wl-paste")
            .args(["--type", "text/plain", "--no-newline"])
            .output()
        {
            if output.status.success() {
                if let Ok(text) = String::from_utf8(output.stdout) {
                    for line in text.lines() {
                        if let Some(path) = extract_image_path(line) {
                            if let Ok(data_url) = read_image_as_data_url(path) {
                                return Ok(Some(data_url));
                            }
                        }
                    }
                }
            }
        }
    }

    Ok(None)
}

#[tauri::command]
pub fn read_image_as_data_url(path: String) -> Result<String, String> {
    let clean = path.trim();
    let without_prefix = clean.strip_prefix("file://").unwrap_or(clean);
    let decoded = percent_encoding::percent_decode_str(without_prefix)
        .decode_utf8()
        .map_err(|e| e.to_string())?;
    let path_buf = std::path::PathBuf::from(decoded.as_ref());

    let bytes = std::fs::read(&path_buf)
        .map_err(|e| format!("Failed to read file {:?}: {}", path_buf, e))?;

    let ext = path_buf
        .extension()
        .and_then(|e| e.to_str())
        .unwrap_or("png")
        .to_lowercase();

    let mime = match ext.as_str() {
        "svg" => "image/svg+xml",
        "jpg" | "jpeg" => "image/jpeg",
        "webp" => "image/webp",
        "gif" => "image/gif",
        "bmp" => "image/bmp",
        _ => "image/png",
    };
    use base64::{engine::general_purpose, Engine as _};
    let b64 = general_purpose::STANDARD.encode(&bytes);
    Ok(format!("data:{};base64,{}", mime, b64))
}

#[tauri::command]
pub fn open_external_url(url: String) -> Result<(), String> {
    let trimmed = url.trim();
    if !trimmed.starts_with("https://") && !trimmed.starts_with("http://") {
        return Err("Only http/https URLs are permitted".to_string());
    }

    #[cfg(target_os = "linux")]
    {
        std::process::Command::new("xdg-open")
            .arg(trimmed)
            .spawn()
            .map_err(|e| format!("Failed to launch browser: {}", e))?;
    }

    #[cfg(target_os = "macos")]
    {
        std::process::Command::new("open")
            .arg(trimmed)
            .spawn()
            .map_err(|e| format!("Failed to launch browser: {}", e))?;
    }

    #[cfg(target_os = "windows")]
    {
        std::process::Command::new("cmd")
            .args(["/C", "start", "", trimmed])
            .spawn()
            .map_err(|e| format!("Failed to launch browser: {}", e))?;
    }

    Ok(())
}
