use tauri::{
    menu::{Menu, MenuItem},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    App, AppHandle, Manager, Window, WindowEvent,
};

/// Sets up the headless System Tray daemon icon and menu
pub fn setup_tray(app: &App) -> Result<(), Box<dyn std::error::Error>> {
    let open_i = MenuItem::with_id(app, "open", "Open UDo", true, None::<&str>)?;
    let quit_i = MenuItem::with_id(app, "quit", "Quit UDo", true, None::<&str>)?;
    let tray_menu = Menu::with_items(app, &[&open_i, &quit_i])?;

    TrayIconBuilder::new()
        .menu(&tray_menu)
        .show_menu_on_left_click(false)
        .on_menu_event(|app, event| match event.id.as_ref() {
            "open" => {
                if let Some(window) = app.get_webview_window("main") {
                    window.show().ok();
                    window.set_focus().ok();
                }
            }
            "quit" => {
                app.exit(0);
            }
            _ => {}
        })
        .on_tray_icon_event(|tray, event| {
            if let TrayIconEvent::Click {
                button: MouseButton::Left,
                button_state: MouseButtonState::Up,
                ..
            } = event
            {
                let app = tray.app_handle();
                if let Some(window) = app.get_webview_window("main") {
                    let _ = window.show();
                    let _ = window.set_focus();
                }
            }
        })
        .build(app)?;

    Ok(())
}

/// Handles window events such as intercepting CloseRequested to hide to tray
pub fn handle_window_event(window: &Window, event: &WindowEvent) {
    if let WindowEvent::CloseRequested { api, .. } = event {
        api.prevent_close();
        window.hide().ok();
    }
}

/// Toggles between full 3-column desktop layout and compact floating mini-widget
#[tauri::command]
pub fn toggle_widget_mode(app: AppHandle, is_mini: bool) -> Result<(), String> {
    if let Some(window) = app.get_webview_window("main") {
        if is_mini {
            window.set_always_on_top(true).ok();
            window
                .set_size(tauri::Size::Logical(tauri::LogicalSize {
                    width: 360.0,
                    height: 280.0,
                }))
                .ok();
        } else {
            window.set_always_on_top(false).ok();
            window
                .set_size(tauri::Size::Logical(tauri::LogicalSize {
                    width: 1180.0,
                    height: 760.0,
                }))
                .ok();
        }
    }
    Ok(())
}
