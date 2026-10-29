use tauri::State;
use sha2::{Digest, Sha256};
use crate::db::DatabaseManager;

const PIN_SETTING_KEY: &str = "vault_pin_hash";

fn hash_pin_with_salt(pin: &str, salt: &str) -> String {
    let mut hasher = Sha256::new();
    hasher.update(salt.as_bytes());
    hasher.update(pin.as_bytes());
    let result = hasher.finalize();
    result.iter().map(|b| format!("{:02x}", b)).collect()
}

fn generate_salt() -> String {
    let now = chrono::Utc::now().timestamp_nanos_opt().unwrap_or(0);
    let mut hasher = Sha256::new();
    hasher.update(now.to_le_bytes());
    hasher.update(b"udo_vault_salt_seed");
    let result = hasher.finalize();
    let hex: String = result.iter().map(|b| format!("{:02x}", b)).collect();
    hex[..16].to_string()
}

pub fn has_vault_pin_db(db: &DatabaseManager) -> Result<bool, String> {
    match db.get_setting(PIN_SETTING_KEY) {
        Ok(Some(hash)) => Ok(!hash.trim().is_empty()),
        Ok(None) => Ok(false),
        Err(e) => Err(e.to_string()),
    }
}

#[tauri::command]
pub fn has_vault_pin(db: State<'_, DatabaseManager>) -> Result<bool, String> {
    has_vault_pin_db(&db)
}

pub fn verify_vault_pin_db(db: &DatabaseManager, pin: &str) -> Result<bool, String> {
    let stored = match db.get_setting(PIN_SETTING_KEY) {
        Ok(Some(hash)) => hash,
        Ok(None) => return Ok(false),
        Err(e) => return Err(e.to_string()),
    };

    let parts: Vec<&str> = stored.split('$').collect();
    if parts.len() != 2 {
        return Ok(false);
    }

    let salt = parts[0];
    let expected_hash = parts[1];
    let computed_hash = hash_pin_with_salt(pin, salt);

    Ok(computed_hash == expected_hash)
}

#[tauri::command]
pub fn verify_vault_pin(db: State<'_, DatabaseManager>, pin: String) -> Result<bool, String> {
    verify_vault_pin_db(&db, &pin)
}

pub fn set_vault_pin_db(
    db: &DatabaseManager,
    current_pin: Option<&str>,
    new_pin: &str,
) -> Result<bool, String> {
    let clean_pin = new_pin.trim();
    if clean_pin.len() != 6 || !clean_pin.chars().all(|c| c.is_ascii_digit()) {
        return Err("PIN must be exactly 6 digits".to_string());
    }

    let existing_hash = db.get_setting(PIN_SETTING_KEY).map_err(|e| e.to_string())?;
    if let Some(stored) = existing_hash {
        if !stored.trim().is_empty() {
            let parts: Vec<&str> = stored.split('$').collect();
            if parts.len() == 2 {
                let salt = parts[0];
                let expected = parts[1];
                let current = current_pin.ok_or_else(|| "Current PIN is required".to_string())?;
                let computed = hash_pin_with_salt(current, salt);
                if computed != expected {
                    return Err("Current PIN is incorrect".to_string());
                }
            }
        }
    }

    let new_salt = generate_salt();
    let hashed = hash_pin_with_salt(clean_pin, &new_salt);
    let record = format!("{}${}", new_salt, hashed);

    db.set_setting(PIN_SETTING_KEY, &record)
        .map_err(|e| e.to_string())?;

    Ok(true)
}

#[tauri::command]
pub fn set_vault_pin(
    db: State<'_, DatabaseManager>,
    current_pin: Option<String>,
    new_pin: String,
) -> Result<bool, String> {
    set_vault_pin_db(&db, current_pin.as_deref(), &new_pin)
}
