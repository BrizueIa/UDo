# Software Requirements Specification (SRS)

**Project:** UDo (The way u do — Local-First Notes & Project Organizer)  
**Version:** 1.0.0  
**Date:** October 27, 2026  
**Status:** Approved for Development  

---

## 1. Product Overview & Vision

### 1.1 Purpose
Build a high-performance, cross-platform desktop application (Linux primary, Windows, and macOS) engineered with a **100% local-first architecture** designed for rich note-taking, hierarchical project organization, and visual freehand sketching.

### 1.2 Design Philosophy
* **Data Sovereignty & Privacy:** Zero accounts, zero telemetry, zero mandatory cloud servers. All user information resides strictly on the local machine.
* **Extreme Speed (0ms Latency):** Instant cold starts, immediate disk persistence, and minimal memory footprint.
* **Progressive Disclosure:** A clean, uncluttered, minimal surface UI (true to the reference design), exposing advanced capabilities through keyboard shortcuts, command palettes, and non-intrusive contextual menus.
* **Physical Fluidity:** Natural spring physics animations at 60 fps providing a tactile, responsive desktop feel.
* **Internationalization & Community Translations (i18n):** Global-first architecture supporting multiple languages out of the box (English default, Spanish), with a community-extensible translation structure (`locales/*.json`).

---

## 2. Official Technology Stack

| Layer | Technology | Justification |
| :--- | :--- | :--- |
| **Native Desktop Shell & Core Engine** | **Tauri v2** (Rust) | ~15 MB installer, ~35 MB RAM footprint, first-class native System Tray, global hotkeys, SQLite FTS5 index, background timers, and OS APIs. |
| **Frontend Framework** | **React + TypeScript** | Strict typing, robust component ecosystem, Feature-Sliced Design. |
| **Animation Engine** | **Framer Motion** | Spring physics, automatic layout transitions (`layoutId`), and micro-interactions. |
| **Styling & Theming** | **Tailwind CSS + CSS Vars** | Dynamic theme swapping (`data-theme`), OLED pure black, and customizable accent colors. |
| **Iconography** | **Lucide Icons** | Crisp, scalable SVG vector icons. |
| **Internationalization** | **i18next / React-i18next** | Declarative localization supporting instant runtime language toggling and community translation contributions. |
| **Markdown & Canvas** | **Markdown GFM + HTML5 Canvas** | GitHub Flavored Markdown, interactive checkboxes, code highlighting, and freehand drawing canvas. |
| **Local Storage** | **SQLite Local (Rust core) / JSON Store** | Atomic transactions, fast indexing, stored in OS standard directories (`~/.local/share/udo/` on Linux). |

---

## 3. Functional Requirements (FR)

### Module A: Core 3-Column Interface
* **FR-01 (Column 1 — Subjects / Branches):**
  * Primary project categories with color indicators and active task counters.
  * Create, edit, and delete subjects via `+` button and context menu.
  * Active subject indicator with subtle illumination and border glow.
* **FR-02 (Column 2 — Folders & Task Lists):**
  * Hierarchical folder tree with smooth spring accordion animations and child item counters.
  * Note/task entries with circular animated checkboxes, title, and strikethrough transition upon completion.
  * Animated filter pills: **"All"**, **"Pending"**, and **"Done"**.
* **FR-03 (Column 3 — Note Detail & Sheet View):**
  * Header actions: "Strikethrough list", folder destination picker, "Add Link" button.
  * Inline editable title.
  * Metadata: relative modification timestamp and interactive tags (`#tags`).
  * **Saved Links & References**: Card layout with external link icons and browser open triggers.
  * **Images & Sketches**: Thumbnail preview gallery with quick click-to-expand.
  * **Sheet Content**: Full Markdown editor with interactive `- [ ]` checkboxes and syntax-highlighted code blocks.
* **FR-04 (Top Bar & Controls):**
  * Frameless modern window controls (traffic lights).
  * Dynamic app title with current project badge.
  * Embedded global search input (`Ctrl + K`).

---

### Module B: Multi-Tier Search Engine
* **FR-05 (Global Search `Ctrl + K`):**
  * Real-time indexed search across all note titles, Markdown body text, tags, and folder names using SQLite FTS5.
  * Grouped results with arrow-key keyboard navigation and instant jump.
* **FR-06 (Category/Folder Scoped Search `Ctrl + F`):**
  * Search scoped strictly to the currently selected subject or folder.
* **FR-07 (In-Note Match Highlighting `Ctrl + Shift + F`):**
  * Highlights occurrences within the active note body.
  * Match counter (e.g., `3 of 12`) with `Enter` / `Shift + Enter` (next / previous match) navigation.

---

### Module C: Keyboard Navigation & Shortcuts
* **FR-08 (Comprehensive Keyboard Controls):**

| Shortcut | Action | Context |
| :--- | :--- | :--- |
| `Alt + Shift + Space` | Toggle App Visibility / Restore from Tray | OS-Wide (Global) |
| `Ctrl + Alt + Space` | Quick Add / Scratchpad Bar | OS-Wide (Global) |
| `Alt + W` | Toggle Full Window ↔ Always-on-Top Floating Widget | Global |
| `Ctrl + K` or `/` | Open Global Search / Command Palette | Global |
| `Ctrl + N` | New Note in current folder | Global |
| `Ctrl + Shift + N` | New Folder / Subject | Global |
| `Ctrl + D` or `Ctrl + Enter` | Toggle strikethrough / completion state | Global / List |
| `Tab` / `Shift + Tab` | Cycle focus: Column 1 ↔ Column 2 ↔ Column 3 | Global |
| `1` / `2` / `3` | Direct jump to Column 1, 2, or 3 | Global |
| `j` / `k` or `↓` / `↑` | Navigate notes in list | List Column |
| `Ctrl + E` | Focus Markdown note editor | Note View |
| `Ctrl + F` | Search within active category | List Column |
| `Ctrl + Shift + F` | Find matches in current note | Note View |
| `F11` | Zen Mode (Toggle distraction-free writing view) | Global |
| `?` or `Ctrl + /` | Open Keyboard Shortcuts Cheat Sheet modal | Global |
| `Esc` | Clear search / Close modals / Unfocus fields | Global |

---

### Module D: Background Daemon, System Tray & Floating Widget
* **FR-09 (System Tray Minimization):**
  * Closing the window hides the application to the OS System Tray without killing the process (<15 MB RAM idle).
  * Tray context menu: *Open UDo*, *Widget Mode*, *Quick Add*, *Quit*.
* **FR-10 (Global System Hotkey):**
  * `Alt + Shift + Space` summons or hides UDo instantly from any application (terminal, IDE, browser).
* **FR-11 (Always-on-Top Floating Widget):**
  * Toggleable via `Alt + W` or header button.
  * Transforms the app into a compact, borderless floating pill that stays on top of all windows (`always-on-top`).
  * Expands on hover/click to display pending tasks, check them off, or add new tasks quickly.

---

### Module E: Productivity, Focus & Instant Capture
* **FR-12 (Quick Add / Scratchpad Bar `Ctrl + Alt + Space`):**
  * Minimalist centered spotlight bar to capture tasks or ideas in seconds and press `Enter` to save directly into the Inbox.
* **FR-13 (Native Desktop Notifications):**
  * System desktop notifications (Linux DBus, Windows toast, macOS) for short deadlines (*"in 15 mins"*) and scheduled reminders.
* **FR-14 (Task Countdown & Focus Timer):**
  * Assign a countdown sprint (e.g., 25 min, 45 min, or custom) to an active task, running in Rust background threads.
* **FR-15 (Satisfying Audio Feedback):**
  * Subtle wooden/click sound upon task completion (with mute toggle in settings).

---

### Module F: Visual Annotations, Image Editor & Whiteboard Canvas
* **FR-16 (Instant Clipboard Paste `Ctrl + V`):**
  * Paste screenshots directly into notes; automatically saved to local storage (`~/.local/share/udo/attachments/`).
* **FR-17 (Interactive Image Viewer & Annotator):**
  * Smooth zoom (mouse wheel / `+`/`-`), pan, and 90° rotation.
  * Interactive crop tool with framing guides.
  * Drawing overlay: freehand pen, semi-transparent highlighter, callout arrows, rectangles, color palette, and undo/redo (`Ctrl + Z`).
* **FR-18 (Whiteboard Canvas Mode):**
  * Full "Whiteboard Note" type for visual brainstorming and diagrams.
  * Embedded "Sketch Block" within standard markdown notes for quick inline drawings.
  * Smooth curve smoothing, eraser, background grid toggle, and export to PNG.

---

### Module G: Advanced UX & Progressive Disclosure
* **FR-19 (Drag & Drop):**
  * Reorder task priorities in list view.
  * Move notes between folders/subjects by dragging.
  * Drop external image files from desktop file managers directly into notes.
* **FR-20 (Pinned Notes 📌):**
  * Pin crucial notes to the top of any folder.
* **FR-21 (Global `#tags`):**
  * Instant transversal filtering across all projects by clicking any tag.
* **FR-22 (Bidirectional `[[Wiki-Links]]`):**
  * Autocomplete note titles with `[[` to link project notes together.
* **FR-23 (Templates):**
  * Quick starter templates: *Blank*, *Design / 3D Project*, *Meeting*, *Daily Checklist*.
* **FR-24 (Trash Bin & Version History):**
  * Soft delete with 30-day retention in Trash before permanent purge.
  * Local snapshot history to restore previous revisions.
* **FR-25 (Autostart on Boot):**
  * Option to start minimized in the tray on system login.

---

### Module H: Theming & Color Customization
* **FR-26 (Preset Themes):**
  1. **Tokyo Night / Midnight (Default):** Deep indigo base with purple and cyan accents.
  2. **Catppuccin Mocha:** Smooth velvet dark pastel tones.
  3. **Nord:** Arctic slate-blue aesthetic.
  4. **Rose Pine:** Warm, retro dark tones.
  5. **OLED Pure Black:** `#000000` absolute contrast for AMOLED displays.
  6. **Catppuccin Latte:** Elegant high-contrast light theme.
* **FR-27 (Accent Color Customization):**
  * Color picker for primary buttons, glows, and active states (Purple, Electric Blue, Emerald, Amber, Neon Pink, Turquoise).

---

### Module I: Internationalization (i18n) & Localization
* **FR-28 (Dual-Language Baseline):**
  * Built-in support for **English** (default) and **Spanish**.
  * Instant language switcher in settings with zero restart required.
* **FR-29 (Community Translation Architecture):**
  * Modular JSON translation files stored under `src/shared/locales/{lang}.json`.
  * Open format allowing community contributors to submit pull requests for new languages effortlessly.

---

### Module J: Governance, Privacy & Open Source Standards
* **FR-30 (Strict Zero-Telemetry Privacy):**
  * Fully compliant with [PRIVACY.md](../governance/PRIVACY.md). Zero user tracking or background telemetry.
* **FR-31 (Data Ownership & Atomic Storage):**
  * Compliant with [DATA_GOVERNANCE.md](../governance/DATA_GOVERNANCE.md). 100% user-owned in standard formats (Markdown, SQLite, PNG), with power-failure-resilient atomic writes.
* **FR-32 (Security & Vulnerability Policy):**
  * Transparent reporting procedure under [SECURITY.md](../../SECURITY.md) with strict dependency audits.
* **FR-33 (Ethical AI Co-Development Disclosure):**
  * Transparent AI disclosure under [AI_DISCLOSURE.md](../governance/AI_DISCLOSURE.md) with 100% human verification and review.
* **FR-34 (Automated Local Backups & Export/Import):**
  * Daily automated JSON snapshots with 7-day retention.
  * One-click database export/import for migration.

---

## 4. Non-Functional Requirements (NFR)

* **NFR-01 (Performance):** Cold launch under 500 ms. Memory consumption < 45 MB active, < 15 MB in system tray.
* **NFR-02 (Cross-Platform Compatibility):** Linux (Wayland & X11 with `.deb` and `.AppImage`), Windows (NSIS `.exe`), macOS (`.dmg`).
* **NFR-03 (Security):** Zero outbound network requests unless explicitly initiated by the user (checking GitHub releases for updates).
* **NFR-04 (Maintainability):** Fully modular codebase with strict TypeScript types, ESLint, and Rust clippy validations.
