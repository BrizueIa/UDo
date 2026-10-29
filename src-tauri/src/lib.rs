pub mod db;
pub mod models;
pub mod commands;
pub mod window;
pub mod services;

use tauri::Manager;
use db::DatabaseManager;
use tauri_plugin_global_shortcut::ShortcutState;
use tauri::webview::{PermissionKind, PermissionResponse};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .on_permission_request(|_webview, kind| match kind {
            PermissionKind::Microphone => PermissionResponse::Allow,
            _ => PermissionResponse::Default,
        })
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
            let db = DatabaseManager::new().map_err(|e| Box::new(e) as Box<dyn std::error::Error>)?;
            app.manage(db);
            app.manage(services::native_audio::NativeAudioState::default());

            window::setup_tray(app)?;
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
            commands::get_clipboard_image,
            commands::read_image_as_data_url,
            window::toggle_widget_mode,
            window::set_widget_size,
            window::minimize_window,
            window::toggle_maximize_window,
            window::close_window_to_tray,
            window::get_window_env,
            services::send_native_notification,
            services::attachments::save_attachment_file,
            services::attachments::open_attachment_native,
            services::attachments::read_attachment_base64,
            services::attachments::delete_attachment_file,
            services::native_audio::get_system_audio_devices,
            services::native_audio::start_native_recording,
            services::native_audio::stop_native_recording,
            services::native_audio::cancel_native_recording,
        ])
        .run(tauri::generate_context!())
        .expect("error while running UDo application");
}
