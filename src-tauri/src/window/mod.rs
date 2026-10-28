use std::str::FromStr;
use tauri::{
    menu::{Menu, MenuItem},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    App, AppHandle, Emitter, Manager, Window, WindowEvent,
};
use tauri_plugin_global_shortcut::{GlobalShortcutExt, Shortcut};

pub fn setup_shortcuts(app: &App) -> Result<(), Box<dyn std::error::Error>> {
    let s1 = Shortcut::from_str("Alt+Shift+Space")?;
    let s2 = Shortcut::from_str("Ctrl+Alt+Space")?;
    app.global_shortcut().register(s1)?;
    app.global_shortcut().register(s2)?;
    Ok(())
}

pub fn handle_global_shortcut(app: &AppHandle, shortcut: &Shortcut) {
    let alt_shift_space = Shortcut::from_str("Alt+Shift+Space").ok();
    let ctrl_alt_space = Shortcut::from_str("Ctrl+Alt+Space").ok();

    if Some(shortcut) == alt_shift_space.as_ref() {
        if let Some(window) = app.get_webview_window("main") {
            if window.is_visible().unwrap_or(false) {
                let _ = window.hide();
            } else {
                let _ = window.unminimize();
                let _ = window.show();
                let _ = window.set_focus();
            }
        }
    } else if Some(shortcut) == ctrl_alt_space.as_ref() {
        if let Some(window) = app.get_webview_window("main") {
            let _ = window.unminimize();
            let _ = window.show();
            let _ = window.set_focus();
            let _ = window.emit("tray:quick-add", ());
        }
    }
}

/// Sets up the headless System Tray daemon icon and menu
pub fn setup_tray(app: &App) -> Result<(), Box<dyn std::error::Error>> {
    let open_i = MenuItem::with_id(app, "open", "Open UDo", true, None::<&str>)?;
    let widget_i = MenuItem::with_id(app, "toggle_widget", "Widget Mode", true, None::<&str>)?;
    let quick_add_i = MenuItem::with_id(app, "quick_add", "Quick Add", true, None::<&str>)?;
    let quit_i = MenuItem::with_id(app, "quit", "Quit UDo", true, None::<&str>)?;
    let tray_menu = Menu::with_items(app, &[&open_i, &widget_i, &quick_add_i, &quit_i])?;

    TrayIconBuilder::new()
        .menu(&tray_menu)
        .show_menu_on_left_click(false)
        .on_menu_event(|app, event| match event.id.as_ref() {
            "open" => {
                if let Some(window) = app.get_webview_window("main") {
                    let _ = window.unminimize();
                    let _ = window.show();
                    let _ = window.set_focus();
                }
            }
            "toggle_widget" => {
                if let Some(window) = app.get_webview_window("main") {
                    let _ = window.unminimize();
                    let _ = window.show();
                    let _ = window.set_focus();
                    let _ = window.emit("tray:toggle-widget", ());
                }
            }
            "quick_add" => {
                if let Some(window) = app.get_webview_window("main") {
                    let _ = window.unminimize();
                    let _ = window.show();
                    let _ = window.set_focus();
                    let _ = window.emit("tray:quick-add", ());
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
                    let _ = window.unminimize();
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

/// Minimizes the application window
#[tauri::command]
pub fn minimize_window(app: AppHandle) -> Result<(), String> {
    if let Some(window) = app.get_webview_window("main") {
        window.minimize().map_err(|e| e.to_string())?;
    }
    Ok(())
}

/// Toggles between maximized and unmaximized states
#[tauri::command]
pub fn toggle_maximize_window(app: AppHandle) -> Result<(), String> {
    if let Some(window) = app.get_webview_window("main") {
        if window.is_maximized().unwrap_or(false) {
            window.unmaximize().map_err(|e| e.to_string())?;
        } else {
            window.maximize().map_err(|e| e.to_string())?;
        }
    }
    Ok(())
}

/// Closes the application window to system tray
#[tauri::command]
pub fn close_window_to_tray(app: AppHandle) -> Result<(), String> {
    if let Some(window) = app.get_webview_window("main") {
        window.hide().map_err(|e| e.to_string())?;
    }
    Ok(())
}

/// Toggles between full 3-column desktop layout and compact floating mini-widget
#[tauri::command]
pub fn toggle_widget_mode(app: AppHandle, is_mini: bool) -> Result<(), String> {
    if let Some(window) = app.get_webview_window("main") {
        if is_mini {
            window
                .set_min_size(Some(tauri::Size::Logical(tauri::LogicalSize {
                    width: 300.0,
                    height: 200.0,
                })))
                .ok();
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
            window
                .set_min_size(Some(tauri::Size::Logical(tauri::LogicalSize {
                    width: 850.0,
                    height: 550.0,
                })))
                .ok();
        }
    }
    Ok(())
}
