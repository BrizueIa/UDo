use std::str::FromStr;
use tauri::{
    menu::{Menu, MenuItem},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    App, AppHandle, Emitter, Manager, Window, WindowEvent,
};
use tauri_plugin_global_shortcut::{GlobalShortcutExt, Shortcut};

#[derive(serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub struct WindowEnvironment {
    pub os: String,
    pub desktop: String,
    pub controls_side: String,
    pub show_min_max: bool,
    pub is_tiling_wm: bool,
}

#[tauri::command]
pub fn get_window_env() -> WindowEnvironment {
    let os = if cfg!(target_os = "macos") {
        "macos".to_string()
    } else if cfg!(target_os = "windows") {
        "windows".to_string()
    } else {
        "linux".to_string()
    };

    if os == "macos" {
        return WindowEnvironment {
            os,
            desktop: "aqua".to_string(),
            controls_side: "left".to_string(),
            show_min_max: true,
            is_tiling_wm: false,
        };
    }

    if os == "windows" {
        return WindowEnvironment {
            os,
            desktop: "explorer".to_string(),
            controls_side: "right".to_string(),
            show_min_max: true,
            is_tiling_wm: false,
        };
    }

    let current_desktop = std::env::var("XDG_CURRENT_DESKTOP").unwrap_or_default().to_lowercase();
    let session_desktop = std::env::var("DESKTOP_SESSION").unwrap_or_default().to_lowercase();
    let is_hyprland = std::env::var("HYPRLAND_INSTANCE_SIGNATURE").is_ok()
        || current_desktop.contains("hyprland")
        || session_desktop.contains("hyprland")
        || session_desktop.contains("omarchy");
    let is_sway_or_i3 = std::env::var("SWAYSOCK").is_ok() || std::env::var("I3SOCK").is_ok();
    let is_tiling = is_hyprland || is_sway_or_i3;

    let is_kde_or_ubuntu = current_desktop.contains("kde")
        || current_desktop.contains("plasma")
        || current_desktop.contains("ubuntu")
        || session_desktop.contains("kde")
        || session_desktop.contains("ubuntu");

    WindowEnvironment {
        os,
        desktop: if is_hyprland {
            "hyprland".to_string()
        } else {
            current_desktop
        },
        controls_side: "right".to_string(),
        show_min_max: is_kde_or_ubuntu,
        is_tiling_wm: is_tiling,
    }
}

pub fn setup_shortcuts(app: &App) -> Result<(), Box<dyn std::error::Error>> {
    let s1 = Shortcut::from_str("Alt+Shift+Space")?;
    let s2 = Shortcut::from_str("Ctrl+Space")?;
    let s3 = Shortcut::from_str("Ctrl+Alt+Space")?;
    let _ = app.global_shortcut().register(s1);
    let _ = app.global_shortcut().register(s2);
    let _ = app.global_shortcut().register(s3);
    Ok(())
}

pub fn handle_global_shortcut(app: &AppHandle, shortcut: &Shortcut) {
    let alt_shift_space = Shortcut::from_str("Alt+Shift+Space").ok();
    let ctrl_space = Shortcut::from_str("Ctrl+Space").ok();
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
    } else if Some(shortcut) == ctrl_space.as_ref() || Some(shortcut) == ctrl_alt_space.as_ref() {
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
        let is_hyprland = std::env::var("HYPRLAND_INSTANCE_SIGNATURE").is_ok()
            || std::env::var("XDG_CURRENT_DESKTOP").unwrap_or_default().to_lowercase().contains("hyprland")
            || std::env::var("DESKTOP_SESSION").unwrap_or_default().to_lowercase().contains("omarchy");

        let pid = std::process::id();

        if is_mini {
            window
                .set_min_size(Some(tauri::Size::Logical(tauri::LogicalSize {
                    width: 260.0,
                    height: 180.0,
                })))
                .ok();
            window.set_always_on_top(true).ok();
            window
                .set_size(tauri::Size::Logical(tauri::LogicalSize {
                    width: 320.0,
                    height: 240.0,
                }))
                .ok();

            if is_hyprland {
                let _ = std::process::Command::new("hyprctl")
                    .args([
                        "--batch",
                        &format!("dispatch setfloating pid:{pid} ; dispatch resizewindowpixel exact 320 240,pid:{pid} ; dispatch centerwindow"),
                    ])
                    .spawn();
            }
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

            if is_hyprland {
                let _ = std::process::Command::new("hyprctl")
                    .args(["dispatch", "settiled", &format!("pid:{pid}")])
                    .spawn();
            }
        }
    }
    Ok(())
}

/// Dynamically resizes floating widget between compact (320x240) and medium note-reading/writing (480x360)
#[tauri::command]
pub fn set_widget_size(app: AppHandle, size: String) -> Result<(), String> {
    if let Some(window) = app.get_webview_window("main") {
        let is_hyprland = std::env::var("HYPRLAND_INSTANCE_SIGNATURE").is_ok()
            || std::env::var("XDG_CURRENT_DESKTOP").unwrap_or_default().to_lowercase().contains("hyprland")
            || std::env::var("DESKTOP_SESSION").unwrap_or_default().to_lowercase().contains("omarchy");

        let pid = std::process::id();
        let (width, height) = if size == "medium" {
            (480.0, 360.0)
        } else {
            (320.0, 240.0)
        };

        window
            .set_size(tauri::Size::Logical(tauri::LogicalSize { width, height }))
            .ok();

        if is_hyprland {
            let _ = std::process::Command::new("hyprctl")
                .args([
                    "--batch",
                    &format!("dispatch setfloating pid:{pid} ; dispatch resizewindowpixel exact {width} {height},pid:{pid}"),
                ])
                .spawn();
        }
    }
    Ok(())
}
