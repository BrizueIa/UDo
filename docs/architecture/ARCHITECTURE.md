# Architecture Specification & System Design

**Project:** UDo (The way u do — Local-First Notes & Project Organizer)  
**Architecture Pattern:** Rust Native Core Engine + Feature-Sliced Reactive UI (FSD)  
**Status:** Approved Architecture  

---

## 1. Architectural Philosophy & Overview

UDo is engineered as a **hybrid high-performance desktop system** separating responsibilities strictly between:
1. **The Native Rust Core (`src-tauri`)**: The single source of truth, persistent storage engine (SQLite with FTS5), thread-isolated background daemons (countdown timers, deadline scheduler, automated backups), OS-level hotkey and tray managers, and atomic file/image storage.
2. **The Reactive Presentation Shell (`src`)**: A high-framerate (60 fps), spring-animated React + TypeScript interface structured under **Feature-Sliced Design (FSD)**, consuming and mutating state via strongly-typed Tauri IPC commands and listening to real-time events.

```
┌────────────────────────────────────────────────────────────────────────┐
│                   PRESENTATION LAYER (React + TypeScript)              │
│                                                                        │
│   ┌─────────────────────┐   ┌───────────────────┐   ┌──────────────┐   │
│   │ Main Window (3-Col) │   │  Floating Widget  │   │  Quick Add   │   │
│   │  (Subjects/Tree/Doc)│   │  (Always-on-Top)  │   │ (Spotlight)  │   │
│   └──────────┬──────────┘   └─────────┬─────────┘   └───────┬──────┘   │
└──────────────┼────────────────────────┼─────────────────────┼──────────┘
               │                        │                     │
               ▼                        ▼                     ▼
┌────────────────────────────────────────────────────────────────────────┐
│                        TAURI IPC PUBSUB & COMMANDS                     │
│    Commands: invoke("create_note", payload) -> Result<Note, Error>     │
│    Events:   app.emit("notes:changed", event) -> Instant Sync Across UI│
└──────────────────────────────────┬─────────────────────────────────────┘
                                   │
                                   ▼
┌────────────────────────────────────────────────────────────────────────┐
│                      NATIVE RUST CORE ENGINE (src-tauri)               │
│                                                                        │
│   ┌────────────────────────┐  ┌──────────────────┐  ┌──────────────┐   │
│   │ SQLite Engine (ACID)   │  │ Background Tasks │  │ OS Services  │   │
│   │ - FTS5 Full-Text Index │  │ - Focus Timers   │  │ - Tray Icon  │   │
│   │ - Auto-Migrations      │  │ - Auto-Backups   │  │ - Hotkeys    │   │
│   │ - Atomic Transactions  │  │ - Notifications  │  │ - File Perms │   │
│   └────────────────────────┘  └──────────────────┘  └──────────────┘   │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Directory Structure Blueprint

```text
UDo/
├── .github/                      # CI/CD pipelines & GitHub Community Templates
│   ├── workflows/                # ci.yml (Quality Gates)
│   ├── ISSUE_TEMPLATE/           # bug_report.md, feature_request.md
│   ├── CONTRIBUTING.md           # Contribution guidelines
│   ├── SECURITY.md               # Vulnerability disclosure policy
│   └── pull_request_template.md  # PR checklist
│
├── docs/                         # Formal Project Documentation
│   ├── specs/                    # Functional specifications (REQUIREMENTS.md)
│   ├── architecture/             # System blueprints (ARCHITECTURE.md)
│   ├── governance/               # PRIVACY.md, DATA_GOVERNANCE.md, AI_DISCLOSURE.md
│   └── workflow/                 # Branching model, commits (BRANCHING_STRATEGY.md)
│
├── src-tauri/                    # NATIVE RUST ENGINE (Single Source of Truth)
│   ├── src/
│   │   ├── db/                   # SQLite connection, migration runner, FTS5 queries
│   │   ├── models/               # Strongly-typed domain structs (Subject, Folder, Note)
│   │   ├── commands/             # Invokable IPC functions exported to frontend
│   │   ├── services/             # Focus timer thread, backup scheduler, clipboard/image handler
│   │   ├── window/               # Tray icon, global hotkey bindings, window manager
│   │   └── main.rs               # Application entrypoint & builder
│   ├── Cargo.toml                # Rust dependencies (rusqlite, serde, tauri, etc.)
│   └── tauri.conf.json           # Tauri capability and window configuration
│
├── src/                          # REACT PRESENTATION LAYER (Feature-Sliced Design)
│   ├── app/                      # Application root, routing between windows, i18n init
│   ├── features/                 # Modular domain slices
│   │   ├── subjects/             # Column 1: Projects/branches tree & indicators
│   │   ├── folders/              # Column 2: Accordion hierarchy & note lists
│   │   ├── note-sheet/           # Column 3: Markdown sheet, tags, external links
│   │   ├── canvas-editor/        # Freehand whiteboard canvas & image annotator
│   │   ├── search-palette/       # Ctrl+K global modal & in-note search
│   │   ├── floating-widget/      # Always-on-top compact overlay mode
│   │   └── focus-timer/          # Visual task countdown timer
│   ├── shared/                   # Cross-cutting primitives
│   │   ├── api/                  # Typed IPC bridge (`invoke` wrappers + fallback mocks)
│   │   ├── hooks/                # Keyboard listeners, theme hooks, audio feedback
│   │   ├── locales/              # Translation catalogs (en.json, es.json)
│   │   ├── styles/               # CSS variables for themes (Tokyo Night, Catppuccin, etc.)
│   │   ├── types/                # Domain TypeScript interfaces
│   │   └── ui/                   # Atomic UI components (buttons, badges, pills, dialogs)
│   ├── index.html                # Vite entry HTML
│   └── main.tsx                  # React entrypoint
│
├── LICENSE                       # Apache License 2.0
├── NOTICE                        # Apache 2.0 attribution
└── README.md                     # Official project landing page
```

---

## 3. Data Flow & Inter-Process Communication (IPC)

### 3.1 Unidirectional Event & Command Cycle
1. **User Action in UI**: User checks a task checkbox or creates a note in any window (Main Window or Floating Widget).
2. **Optimistic UI Update**: The local React state updates immediately (0ms response time) with spring physics animations.
3. **IPC Invocation**: The client triggers a Rust command, e.g.:
   ```typescript
   await tauriApi.notes.toggleComplete(noteId);
   ```
4. **Rust Atomic Mutation**: Rust executes an ACID SQLite transaction, updates the FTS5 search index, and persists change to disk.
5. **Cross-Window Broadcast**: Rust emits a Tauri event:
   ```rust
   app_handle.emit("notes:updated", &updated_note)?;
   ```
6. **Passive Sync**: All other open windows (e.g. Floating Widget or Main Window) catch the event and sync state without polling.

---

## 4. Background Service Architecture

### 4.1 Headless System Tray Daemon
* When the main window is closed (`CloseRequested`), Rust suppresses the destruction event and calls `window.hide()`.
* The background process remains active, managing:
  1. **Focus Timer Engine**: Native background thread tracking countdown timers. When time expires, it fires an OS-native notification via Linux DBus, Windows Toast, or macOS Notification Center.
  2. **Global Hotkey Daemon**: Listens for `Alt + Shift + Space` (toggle main app) and `Ctrl + Alt + Space` (summon Quick Add spotlight bar).
  3. **Auto-Backup Engine**: Generates daily JSON backups in `~/.local/share/udo/backups/`.

---

## 5. Storage Schema & Non-Destructive Migrations

All local data is stored in SQLite under `~/.local/share/udo/udo.db`:
* `subjects`: `(id, name, color, icon, sort_order, created_at, updated_at)`
* `folders`: `(id, subject_id, name, is_expanded, sort_order, created_at)`
* `notes`: `(id, folder_id, subject_id, title, content, is_completed, is_pinned, focus_minutes, created_at, updated_at, is_deleted)`
* `notes_fts`: Virtual FTS5 table indexing `(title, content, tags)` for sub-millisecond search.
* `tags`: `(id, note_id, name)`
* `links`: `(id, note_id, title, url, sort_order)`
* `attachments`: `(id, note_id, file_path, original_name, mime_type, created_at)`

**Migration Safeguard**: Schema versioning is tracked via `PRAGMA user_version`. Upgrades execute linear, forward-compatible SQL migrations wrapped in transactions.
