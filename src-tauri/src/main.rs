#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri::{
  WebviewUrl, WebviewWindowBuilder,
  tray::TrayIconBuilder,
  menu::{MenuBuilder, MenuItemBuilder},
  Manager
};

// ✅ Your live domain (keep the trailing slash)
const PROD_URL: &str = "https://www.jortaskmanager.com/";

fn build_tray(app: &tauri::App) -> tauri::Result<()> {
  // Tray menu: Open Dashboard + Quit
  let menu = MenuBuilder::new(app)
    .item(&MenuItemBuilder::with_id("show", "Open Dashboard").build(app)?)
    .separator()
    .item(&MenuItemBuilder::with_id("quit", "Quit").build(app)?)
    .build()?;

  TrayIconBuilder::new()
    .icon(app.default_window_icon().unwrap().clone())
    .menu(&menu)
    .on_menu_event(|app, event| {
      match event.id.as_ref() {
        "show" => {
          if let Some(win) = app.get_webview_window("main") {
            let _ = win.show();
            let _ = win.set_focus();
          }
        }
        "quit" => app.exit(0),
        _ => {}
      }
    })
    .build(app)?;

  Ok(())
}

fn main() {
  tauri::Builder::default()
    .setup(|app| {
      // Window: dev -> localhost, prod -> your domain
      #[cfg(debug_assertions)]
      {
        WebviewWindowBuilder::new(
          app, "main",
          WebviewUrl::External("http://localhost:3000/".parse().unwrap()),
        )
        .title("JOR Task Manager")
        .inner_size(1100.0, 750.0)
        .build()?;
      }
      #[cfg(not(debug_assertions))]
      {
        WebviewWindowBuilder::new(
          app, "main",
          WebviewUrl::External(PROD_URL.parse().unwrap()),
        )
        .title("JOR Task Manager")
        .inner_size(1100.0, 750.0)
        .build()?;
      }

      // Tray
      build_tray(app)?;
      Ok(())
    })
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
