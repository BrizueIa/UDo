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

## 🔍 Pull Request Guidelines

1. **Keep it focused:** Each PR should address one specific feature, bug fix, or translation.
2. **Type Safety:** Ensure TypeScript passes cleanly (`npm run build`).
3. **Rust Checks:** Ensure Tauri backend passes clippy without warnings (`cargo clippy`).
4. **AI-Assisted Contributions:** If you used generative AI tools to assist in writing code, please mention it in your PR description as outlined in [AI_DISCLOSURE.md](AI_DISCLOSURE.md). You are responsible for validating the correctness of the code.

---

## License
By contributing to UDo, you agree that your contributions will be licensed under the project's [Apache License 2.0](LICENSE).
