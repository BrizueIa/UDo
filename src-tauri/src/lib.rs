pub mod db;
pub mod models;
pub mod commands;
pub mod window;

use tauri::Manager;
use db::DatabaseManager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .setup(|app| {
            // Initialize DatabaseManager once and register into Tauri state
            let db = DatabaseManager::new().map_err(|e| Box::new(e) as Box<dyn std::error::Error>)?;
            app.manage(db);

            // Initialize System Tray and menu
            window::setup_tray(app)?;

            Ok(())
        })
        .on_window_event(|window, event| {
            window::handle_window_event(window, event);
        })
        .invoke_handler(tauri::generate_handler![
            commands::get_initial_data,
            commands::save_note,
            commands::delete_note,
            commands::save_subject,
            commands::delete_subject,
            commands::save_folder,
            commands::delete_folder,
            window::toggle_widget_mode,
        ])
        .run(tauri::generate_context!())
        .expect("error while running UDo application");
}
