pub mod db;
pub mod models;
pub mod commands;
pub mod window;
pub mod services;

use tauri::Manager;
use db::DatabaseManager;
use tauri_plugin_global_shortcut::ShortcutState;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_notification::init())
        .plugin(
            tauri_plugin_global_shortcut::Builder::new()
                .with_handler(|app, shortcut, event| {
                    if event.state() == ShortcutState::Pressed {
                        window::handle_global_shortcut(app, shortcut);
                    }
                })
                .build(),
        )
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .setup(|app| {
            // Initialize DatabaseManager once and register into Tauri state
            let db = DatabaseManager::new().map_err(|e| Box::new(e) as Box<dyn std::error::Error>)?;
            app.manage(db);

            // Initialize System Tray and menu
            window::setup_tray(app)?;

            // Register global shortcuts
            window::setup_shortcuts(app)?;

            Ok(())
        })
        .on_window_event(|window, event| {
            window::handle_window_event(window, event);
        })
        .invoke_handler(tauri::generate_handler![
            commands::get_initial_data,
            commands::search_notes,
            commands::save_note,
            commands::delete_note,
            commands::save_subject,
            commands::delete_subject,
            commands::save_folder,
            commands::delete_folder,
            window::toggle_widget_mode,
            window::minimize_window,
            window::toggle_maximize_window,
            window::close_window_to_tray,
            window::get_window_env,
            services::send_native_notification,
        ])
        .run(tauri::generate_context!())
        .expect("error while running UDo application");
}
