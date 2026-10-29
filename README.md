<p align="center">
  <img src="assets/UDo-logo-horizontal-vector.svg" alt="UDo - The way u do" width="640" />
</p>

<p align="center">
  <em>An opinionated, local-first notes and project organizer built for multi-branch workflows. Tree hierarchy, strikethrough sheets, and quick desktop access.</em>
</p>

<p align="center">
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-Apache%202.0-blue.svg" alt="License"></a>
  <img src="https://img.shields.io/badge/platform-Linux%20%7C%20Windows%20%7C%20macOS-lightgrey.svg" alt="Platform">
  <img src="https://img.shields.io/badge/privacy-100%25%20Local--First-brightgreen.svg" alt="Local First">
  <img src="https://img.shields.io/badge/built%20with-Tauri%20v2%20%2B%20React-orange.svg" alt="Tech Stack">
</p>

---

## ⚡ Highlights

* **100% Local-First & Zero Telemetry:** Your data never leaves your machine. No accounts, no subscriptions, zero network tracking.
* **3-Column Multi-Branch Workflow:**
  * **Subjects / Temas:** Color-coded primary branches with dynamic counters.
  * **Folders & Hierarchy:** Expandable tree folders with spring-physics accordion animations.
  * **Strikethrough Sheets:** Rich notes with inline task checkboxes, external reference links, and image sketches.
* **Always-on-Top Floating Widget:** Shrink UDo to an unobtrusive desktop pill that stays on top of your IDE or browser for rapid task checking.
* **System Tray & Global Hotkey:** Closes to the system tray like Spotify/Telegram. Summon or hide it globally using `Alt + Shift + Space`.
* **Quick Add / Spotlight Bar:** Press `Ctrl + Alt + Space` to capture ideas or tasks in 2 seconds without interrupting your workflow.
* **Visual Annotations & Whiteboard:**
  * Interactive image viewer with zoom, rotation, crop, pen, highlighter, and callout arrows.
  * Freehand whiteboard canvas mode for diagrams and design sketches.
* **Keyboard-First Experience:** Full keyboard navigation (`j/k`, `Tab`, `Ctrl + K`, `Ctrl + D`, `Ctrl + N`).
* **Multi-Theme System:** Preset color themes (Tokyo Night, Catppuccin Mocha, Nord, Rose Pine, OLED Pure Black, Latte) plus custom accent colors.
* **Drag & Drop:** Reorder priorities and move notes across branches intuitively.
* **Focus Timer & Short Deadlines:** Built-in countdown timer for task sprints with native desktop notifications.

---

## 🏛️ Architecture & Stack

* **Shell:** [Tauri v2](https://v2.tauri.app/) (Rust native wrapper, ~15MB bundle size, ~35MB RAM).
* **UI Layer:** React 19 + TypeScript.
* **Styling:** Tailwind CSS with dynamic CSS variables for theming.
* **Physics & Animations:** Framer Motion (spring physics, layoutId transitions).
* **Storage:** Local SQLite / Local JSON Store with atomic transactions and automated daily backups.

---

## ⌨️ Keyboard Shortcuts Cheat Sheet

| Shortcut | Action | Scope |
| :--- | :--- | :--- |
| `Alt + Shift + Space` | Summon / Hide UDo (Global Desktop Hotkey) | OS-Wide |
| `Ctrl + Alt + Space` | Quick Add / Scratchpad Bar | OS-Wide |
| `Alt + W` | Toggle Full Window ↔ Floating Always-on-Top Widget | Global |
| `Ctrl + K` or `/` | Global Search & Command Palette | Global |
| `Ctrl + N` | New Note in active folder | Global |
| `Ctrl + Shift + N` | New Folder / Subject | Global |
| `Ctrl + D` or `Ctrl + Enter` | Toggle note strikethrough / completed | Global / List |
| `Tab` / `Shift + Tab` | Cycle focus between Columns (Subjects ↔ List ↔ Note) | Global |
| `1` / `2` / `3` | Jump directly to Column 1, 2, or 3 | Global |
| `j` / `k` or `↓` / `↑` | Navigate notes in list | List Column |
| `Ctrl + E` | Focus Markdown Note Editor | Note View |
| `Ctrl + F` | Search within active category/folder | List Column |
| `Ctrl + Shift + F` | Search & highlight matches inside note | Note Editor |
| `F11` | Zen Mode (Collapse sidebars for distraction-free writing) | Global |
| `?` or `Ctrl + /` | Open Keyboard Shortcuts Cheat Sheet | Global |
| `Esc` | Clear search / Close modals / Unfocus editor | Global |

---

## 📜 Architecture, Governance & Policies

UDo is built as an open, transparent, and security-conscious tool:

* **[ARCHITECTURE.md](docs/architecture/ARCHITECTURE.md)**: Native Rust Core Engine + Feature-Sliced UI specification and data flow.
* **[REQUIREMENTS.md](docs/specs/REQUIREMENTS.md)**: Full Software Requirements Specification (SRS) with FR-01 through FR-34.
* **[BRANCHING_STRATEGY.md](docs/workflow/BRANCHING_STRATEGY.md)**: Conventional Commits, branch protection rules, and CI Quality Gates.
* **[PRIVACY.md](docs/governance/PRIVACY.md)**: Strict zero-telemetry policy, 100% offline-first design (GDPR/CCPA compliant).
* **[DATA_GOVERNANCE.md](docs/governance/DATA_GOVERNANCE.md)**: User data sovereignty, atomic writes, non-proprietary storage formats.
* **[AI_DISCLOSURE.md](docs/governance/AI_DISCLOSURE.md)**: Ethical AI co-development disclosure and human verification guidelines.
* **[SECURITY.md](.github/SECURITY.md)**: Vulnerability disclosure procedure and dependency auditing standards.
* **[CONTRIBUTING.md](.github/CONTRIBUTING.md)**: Guidelines for contributing and code standards.

---

## 🚀 Development & Contributing

### Prerequisites
* [Node.js](https://nodejs.org/) (v18+)
* [Rust](https://rustup.rs/) (v1.75+)
* Linux dependencies (Ubuntu/Debian):
  ```bash
  sudo apt update && sudo apt install libwebkit2gtk-4.1-dev build-essential curl wget file libxdo-dev libssl-dev libayatana-appindicator3-dev librsvg2-dev
  ```

### Getting Started
```bash
# Clone the repository
git clone https://github.com/BrizueIa/UDo.git
cd UDo

# Install dependencies
npm install

# Run in development mode
npm run tauri dev

# Build production bundle (.deb, .AppImage, .exe, .dmg)
npm run tauri build
```

---

## 📄 License

Licensed under the **Apache License, Version 2.0**. See [LICENSE](LICENSE) and [NOTICE](NOTICE) for details.

Copyright © 2026 Brizuela.
