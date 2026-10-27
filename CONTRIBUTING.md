# Contributing to UDo

Thank you for your interest in contributing to **UDo**! As an open-source, local-first productivity tool, community contributions help keep UDo fast, reliable, and accessible worldwide.

---

## Code of Conduct
Please ensure all discussions, issue comments, and pull requests remain constructive, respectful, and inclusive.

---

## 🌍 Contributing Translations (i18n)

UDo is designed for global accessibility. We enthusiastically welcome community translations!

### How to Add a New Language:
1. Check `src/locales/en.json` (the base English locale reference).
2. Create a new JSON file named after your ISO 639-1 language code (e.g., `src/locales/fr.json` for French, `src/locales/de.json` for German, `src/locales/ja.json` for Japanese).
3. Copy the keys from `en.json` and provide accurate, natural translations.
4. Register the new locale in `src/locales/index.ts`.
5. Submit a Pull Request titled `i18n: add [Language Name] translation`.

---

## 🛠️ Development Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/BrizueIa/UDo.git
   cd UDo
   ```

2. **Install prerequisites:**
   * Node.js v18+
   * Rust v1.75+
   * Linux WebKitGTK and build tools (on Ubuntu/Debian: `sudo apt install libwebkit2gtk-4.1-dev build-essential curl wget file libxdo-dev libssl-dev libayatana-appindicator3-dev librsvg2-dev`).

3. **Install dependencies & run dev environment:**
   ```bash
   npm install
   npm run tauri dev
   ```

---

## 🌳 Branching Workflow & Quality Rules

Please read **[BRANCHING_STRATEGY.md](docs/workflow/BRANCHING_STRATEGY.md)** for full architectural details.

1. **Target Branch:** **All community pull requests must target the `dev` branch.**
2. **Review & Approval:** Only the project maintainer (`@BrizueIa`) reviews and merges PRs into `dev`. Releases from `dev` to `main` are handled exclusively by `@BrizueIa`.
3. **Squash & Merge:** All PRs are squashed into a single clean semantic commit upon merge.
4. **CI Quality Gates:** PRs must pass all automated GitHub Actions checks (`frontend-gate` and `rust-gate`).
5. **Zero Data Loss:** Schema modifications must include non-destructive, forward-compatible migrations.

---

## 📝 Conventional Commits Standard

Every commit and PR title must follow the Conventional Commits format:
`type(scope): description`

Examples:
* `feat(widget): add always-on-top floating pill mode`
* `fix(tray): prevent zombie process on Linux close`
* `i18n(es): add full spanish translations for shortcuts`
* `docs(readme): add Linux keyboard shortcut table`
* `perf(search): optimize full-text search indexing speed`

---

## 🔍 Pull Request Guidelines

1. **Target `dev`:** Make sure your PR base branch is `dev`, never `main`.
2. **Commit Convention:** Use Conventional Commits format for your PR title.
3. **Type Safety:** Ensure TypeScript passes cleanly (`npm run build`).
4. **Rust Checks:** Ensure Tauri backend passes clippy without warnings (`cargo clippy`).
5. **AI-Assisted Contributions:** If you used generative AI tools to assist in writing code, please mention it in your PR description as outlined in [AI_DISCLOSURE.md](docs/governance/AI_DISCLOSURE.md). You are responsible for validating the correctness of the code.

---

## License
By contributing to UDo, you agree that your contributions will be licensed under the project's [Apache License 2.0](LICENSE).
