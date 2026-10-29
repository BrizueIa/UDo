use base64::{engine::general_purpose, Engine as _};
use std::fs;
use std::path::{Path, PathBuf};

const BLOCKED_EXTENSIONS: &[&str] = &[
    "iso", "img", "dmg", "vmdk", "qcow2", "exe", "msi", "bat", "cmd", "com",
    "scr", "pif", "vbs", "ps1", "dll", "sys", "so", "dylib", "bin", "run",
    "appimage", "sh",
];

fn get_attachments_dir() -> Result<PathBuf, String> {
    let mut data_dir = dirs::data_local_dir().unwrap_or_else(|| PathBuf::from("."));
    data_dir.push("udo");
    data_dir.push("attachments");
    fs::create_dir_all(&data_dir).map_err(|e| format!("Failed to create attachments dir: {}", e))?;
    Ok(data_dir)
}

fn get_extension(name: &str) -> String {
    Path::new(name)
        .extension()
        .and_then(|ext| ext.to_str())
        .unwrap_or("")
        .to_lowercase()
}

fn mime_for_extension(ext: &str) -> &'static str {
    match ext {
        "webm" => "audio/webm",
        "ogg" | "oga" => "audio/ogg",
        "mp3" => "audio/mpeg",
        "wav" => "audio/wav",
        "m4a" => "audio/mp4",
        "aac" => "audio/aac",
        "pdf" => "application/pdf",
        "json" => "application/json",
        "txt" => "text/plain",
        "md" => "text/markdown",
        "png" => "image/png",
        "jpg" | "jpeg" => "image/jpeg",
        "webp" => "image/webp",
        "gif" => "image/gif",
        "svg" => "image/svg+xml",
        "zip" => "application/zip",
        "stl" => "model/stl",
        _ => "application/octet-stream",
    }
}

#[derive(serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AttachmentInfo {
    pub name: String,
    pub file_path: String,
    pub mime_type: String,
    pub size_bytes: u64,
    pub extension: String,
}

#[tauri::command]
pub fn save_attachment_from_path(source_path: String) -> Result<AttachmentInfo, String> {
    let path = Path::new(&source_path);
    if !path.exists() || !path.is_file() {
        return Err(format!("File does not exist: {}", source_path));
    }

    let file_name = path
        .file_name()
        .and_then(|n| n.to_str())
        .unwrap_or("unnamed_file")
        .to_string();

    let ext = get_extension(&file_name);
    if BLOCKED_EXTENSIONS.contains(&ext.as_str()) {
        return Err(format!("File extension '{}' is blocked for security reasons.", ext));
    }

    let meta = fs::metadata(path).map_err(|e| format!("Failed to read file metadata: {}", e))?;
    let size_bytes = meta.len();
    let mime = mime_for_extension(&ext).to_string();

    let dir = get_attachments_dir()?;
    let timestamp = chrono::Utc::now().timestamp_millis();
    let sanitized_name: String = file_name
        .chars()
        .map(|c| if c.is_alphanumeric() || c == '.' || c == '-' || c == '_' { c } else { '_' })
        .collect();

    let target_name = format!("{}_{}", timestamp, sanitized_name);
    let target_path = dir.join(target_name);

    fs::copy(path, &target_path)
        .map_err(|e| format!("Failed to copy attachment file: {}", e))?;

    let clean_name = if let Some(idx) = file_name.find('_') {
        let prefix = &file_name[..idx];
        if prefix.len() >= 10 && prefix.chars().all(|c| c.is_ascii_digit()) {
            file_name[idx + 1..].to_string()
        } else {
            file_name.clone()
        }
    } else {
        file_name.clone()
    };

    Ok(AttachmentInfo {
        name: clean_name,
        file_path: target_path.to_string_lossy().to_string(),
        mime_type: mime,
        size_bytes,
        extension: ext,
    })
}

#[tauri::command]
pub fn save_attachment_file(file_name: String, bytes: Vec<u8>) -> Result<String, String> {
    let ext = get_extension(&file_name);
    if BLOCKED_EXTENSIONS.contains(&ext.as_str()) {
        return Err(format!("File extension '{}' is blocked for security reasons.", ext));
    }

    let dir = get_attachments_dir()?;
    let timestamp = chrono::Utc::now().timestamp_millis();
    let sanitized_name: String = file_name
        .chars()
        .map(|c| if c.is_alphanumeric() || c == '.' || c == '-' || c == '_' { c } else { '_' })
        .collect();

    let target_name = format!("{}_{}", timestamp, sanitized_name);
    let target_path = dir.join(target_name);

    fs::write(&target_path, bytes)
        .map_err(|e| format!("Failed to save attachment file: {}", e))?;

    Ok(target_path.to_string_lossy().to_string())
}

#[tauri::command]
pub fn open_attachment_native(file_path: String) -> Result<(), String> {
    let path = Path::new(&file_path);
    if !path.exists() {
        return Err(format!("Attachment file not found at: {}", file_path));
    }

    #[cfg(target_os = "linux")]
    {
        std::process::Command::new("xdg-open")
            .arg(&file_path)
            .spawn()
            .map_err(|e| format!("Failed to launch xdg-open: {}", e))?;
    }

    #[cfg(target_os = "macos")]
    {
        std::process::Command::new("open")
            .arg(&file_path)
            .spawn()
            .map_err(|e| format!("Failed to launch open: {}", e))?;
    }

    #[cfg(target_os = "windows")]
    {
        std::process::Command::new("cmd")
            .args(["/C", "start", "", &file_path])
            .spawn()
            .map_err(|e| format!("Failed to launch start: {}", e))?;
    }

    Ok(())
}

#[tauri::command]
pub fn read_attachment_base64(file_path: String) -> Result<String, String> {
    let path = Path::new(&file_path);
    if !path.exists() {
        return Err(format!("Attachment file not found at: {}", file_path));
    }

    let bytes = fs::read(path).map_err(|e| format!("Failed to read attachment file: {}", e))?;
    let b64 = general_purpose::STANDARD.encode(&bytes);
    let ext = get_extension(&file_path);
    let mime = mime_for_extension(&ext);

    Ok(format!("data:{};base64,{}", mime, b64))
}

#[tauri::command]
pub fn delete_attachment_file(file_path: String) -> Result<(), String> {
    let path = Path::new(&file_path);
    if path.exists() {
        fs::remove_file(path).map_err(|e| format!("Failed to delete attachment: {}", e))?;
    }
    Ok(())
}
