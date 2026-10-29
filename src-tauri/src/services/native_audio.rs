use serde::Serialize;
use std::fs;
use std::path::{Path, PathBuf};
use std::process::{Child, Command};
use std::sync::Mutex;

#[derive(Serialize, Clone)]
pub struct AudioDeviceInfo {
    pub id: String,
    pub name: String,
}

#[derive(Serialize, Clone)]
pub struct SystemAudioDevices {
    pub inputs: Vec<AudioDeviceInfo>,
    pub outputs: Vec<AudioDeviceInfo>,
}

pub struct NativeAudioState {
    pub recording_child: Mutex<Option<(Child, PathBuf)>>,
}

impl Default for NativeAudioState {
    fn default() -> Self {
        Self {
            recording_child: Mutex::new(None),
        }
    }
}

fn get_attachments_dir() -> PathBuf {
    let mut data_dir = dirs::data_local_dir().unwrap_or_else(|| PathBuf::from("."));
    data_dir.push("udo");
    data_dir.push("attachments");
    fs::create_dir_all(&data_dir).ok();
    data_dir
}

#[tauri::command]
pub fn get_system_audio_devices() -> Result<SystemAudioDevices, String> {
    let mut inputs = Vec::new();
    let mut outputs = Vec::new();

    // Try parsing pactl on Linux
    if let Ok(output) = Command::new("pactl").args(["list", "sources"]).output() {
        if output.status.success() {
            let stdout = String::from_utf8_lossy(&output.stdout);
            let mut curr_name = String::new();
            for line in stdout.lines() {
                let trimmed = line.trim();
                if trimmed.starts_with("Name: ") {
                    curr_name = trimmed.trim_start_matches("Name: ").to_string();
                } else if trimmed.starts_with("Description: ") && !curr_name.is_empty() {
                    let desc = trimmed.trim_start_matches("Description: ").to_string();
                    if !curr_name.ends_with(".monitor") {
                        inputs.push(AudioDeviceInfo { id: curr_name.clone(), name: desc });
                    }
                    curr_name.clear();
                }
            }
        }
    }

    if let Ok(output) = Command::new("pactl").args(["list", "sinks"]).output() {
        if output.status.success() {
            let stdout = String::from_utf8_lossy(&output.stdout);
            let mut curr_name = String::new();
            for line in stdout.lines() {
                let trimmed = line.trim();
                if trimmed.starts_with("Name: ") {
                    curr_name = trimmed.trim_start_matches("Name: ").to_string();
                } else if trimmed.starts_with("Description: ") && !curr_name.is_empty() {
                    let desc = trimmed.trim_start_matches("Description: ").to_string();
                    outputs.push(AudioDeviceInfo { id: curr_name.clone(), name: desc });
                    curr_name.clear();
                }
            }
        }
    }

    Ok(SystemAudioDevices { inputs, outputs })
}

#[tauri::command]
pub fn start_native_recording(
    state: tauri::State<'_, NativeAudioState>,
    target_device: Option<String>,
) -> Result<(), String> {
    let mut lock = state.recording_child.lock().map_err(|e| e.to_string())?;
    if lock.is_some() {
        return Err("A recording is already in progress.".into());
    }

    let dir = get_attachments_dir();
    let temp_file = dir.join(format!("temp_rec_{}.wav", chrono::Utc::now().timestamp_millis()));

    let child = if Path::new("/usr/bin/pw-record").exists() || which_cmd("pw-record") {
        let mut cmd = Command::new("pw-record");
        if let Some(dev) = target_device {
            if !dev.trim().is_empty() {
                cmd.args(["--target", dev.trim()]);
            }
        }
        cmd.arg(&temp_file);
        cmd.spawn().map_err(|e| format!("Failed to spawn pw-record: {}", e))?
    } else {
        let mut cmd = Command::new("arecord");
        cmd.args(["-f", "cd"]).arg(&temp_file);
        cmd.spawn().map_err(|e| format!("Failed to spawn arecord: {}", e))?
    };

    *lock = Some((child, temp_file));
    Ok(())
}

#[tauri::command]
pub fn stop_native_recording(
    state: tauri::State<'_, NativeAudioState>,
) -> Result<String, String> {
    let mut lock = state.recording_child.lock().map_err(|e| e.to_string())?;
    let (mut child, temp_file) = lock.take().ok_or("No active recording.")?;

    // Terminate the process cleanly
    let _ = child.kill();
    let _ = child.wait();

    if !temp_file.exists() {
        return Err("Recorded file does not exist.".into());
    }

    let final_name = format!("voice-{}.wav", chrono::Utc::now().timestamp_millis());
    let final_path = temp_file.with_file_name(final_name);
    fs::rename(&temp_file, &final_path).map_err(|e| format!("Failed to rename recording: {}", e))?;

    Ok(final_path.to_string_lossy().to_string())
}

#[tauri::command]
pub fn cancel_native_recording(
    state: tauri::State<'_, NativeAudioState>,
) -> Result<(), String> {
    let mut lock = state.recording_child.lock().map_err(|e| e.to_string())?;
    if let Some((mut child, temp_file)) = lock.take() {
        let _ = child.kill();
        let _ = child.wait();
        if temp_file.exists() {
            let _ = fs::remove_file(temp_file);
        }
    }
    Ok(())
}

fn which_cmd(name: &str) -> bool {
    Command::new("which")
        .arg(name)
        .output()
        .map(|o| o.status.success())
        .unwrap_or(false)
}
