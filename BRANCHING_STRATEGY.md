# Branching Strategy & Repository Governance

This document establishes the official branching model, commit standards, quality gates, and data protection rules for **UDo**.

---

## 🌳 Core Branch Architecture

```
  (Hotfix / Tagged Releases)
        ┌─────────────┐
main:   │  v1.0.0     │─────────────────────► v1.1.0 (Production Stable)
        └──────▲──────┘                        ▲
               │ Release PR (Squash & Merge)   │ Release PR (Squash & Merge)
dev:    ───────┴───────────┬──────────────┬────┴─────► (Active Development)
                           ▲              ▲
                           │ PR           │ PR (Squash & Merge)
feature/widget: ───────────┘              │
i18n/es-locale: ──────────────────────────┘
```

### 1. `main` (Production & Releases)
* **Status:** Always stable, production-ready, and directly installable.
* **Write Access:** **Strictly restricted to the Project Maintainer (`@BrizueIa`).** Direct pushes by collaborators are blocked.
* **Deployment Trigger:** Every git tag pushed to `main` (e.g., `v1.0.0`) triggers automated CI/CD builds for Linux (`.deb`, `.AppImage`), Windows (`.exe`), and macOS (`.dmg`).
* **Source:** Receives merges exclusively from `dev` through signed Release Pull Requests.

### 2. `dev` (Integration & Development)
* **Status:** Primary integration branch for upcoming releases.
* **Write Access:** Protected. Community contributors must fork and submit a Pull Request targeting `dev`.
* **Merge Requirement:** All Pull Requests require explicit review and approval by **`@BrizueIa`** before merging.
* **CI Quality Gates:** All automated checks (TypeScript, Rust Clippy, Linting, Security Audits) must pass with a green checkmark before merge approval.

### 3. Topic Branches (`feat/*`, `fix/*`, `i18n/*`, `docs/*`)
All new work stems from and merges back into `dev`:
* `feat/<feature-name>`: New capabilities (e.g., `feat/floating-widget`, `feat/quick-add`).
* `fix/<bug-description>`: Bug fixes (e.g., `fix/tray-icon-linux`, `fix/shortcut-collision`).
* `i18n/<lang-code>`: Community translations (e.g., `i18n/fr-locale`, `i18n/ja-locale`).
* `docs/<topic>`: Documentation updates (e.g., `docs/shortcut-guide`).

---

## 📜 Rule 1: Conventional Commits Standard

All commits and PR titles must follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

```text
<type>(<scope>): <short description in imperative, lower case>
```

### Allowed Types:
* `feat`: A new feature (e.g., `feat(widget): add always-on-top floating pill mode`).
* `fix`: A bug fix (e.g., `fix(tray): prevent zombie process on Linux close`).
* `i18n`: Translations and localization (e.g., `i18n(es): add full spanish translations for shortcuts`).
* `docs`: Documentation changes only (e.g., `docs(readme): add Linux keyboard shortcut table`).
* `perf`: A code change that improves performance (e.g., `perf(search): optimize full-text search indexing speed`).
* `refactor`: A code change that neither fixes a bug nor adds a feature.
* `test`: Adding or correcting tests.
* `chore`: Maintenance tasks, dependency bumps, or tool configurations.

> **Automated Benefit:** This enables automated generation of release notes and `CHANGELOG.md` upon every release tag.

---

## 🔀 Rule 2: Squash and Merge Strategy

* When merging approved Pull Requests into `dev` or `main`, the **Squash and Merge** strategy is mandatory.
* Individual experimental or work-in-progress commits in the contributor's branch are compressed into a single clean, semantic commit on `dev`.
* This ensures the git history on `dev` and `main` remains linear, readable, and git-bisect friendly.

---

## 🛡️ Rule 3: Zero-Data-Loss Database Migrations

In local-first software, **user data safety is sacred**.

* **Non-Destructive Schema Evolution:** Any update introducing schema alterations (new columns, indexes, or tables) must provide an automated, forward-compatible SQLite migration script.
* **Zero User Friction:** Migrations run silently and atomically on application startup before the UI mounts.
* **Integrity Guarantee:** A test suite validates that legacy database backups (from version `1.0.0`) open flawlessly in the latest version without data corruption.

---

## 🚦 Rule 4: CI Quality Gates (Automated Enforcers)

Pull Requests cannot be merged if any of the following automated GitHub Actions gates fail:
1. **Type Safety:** `npm run build` must compile with 0 TypeScript errors.
2. **Rust & Clippy:** `cargo clippy -- -D warnings` must compile with 0 warnings.
3. **Code Formatting:** Code adheres to `prettier` and `rustfmt` rules.
4. **Security Audits:** `npm audit` and `cargo audit` report 0 critical or high CVEs.

---

## 🔒 GitHub Repository Settings Checklist for `@BrizueIa`

Under **Settings → Branches → Branch protection rules** (or **Rulesets**):

### For `main`:
- [x] Branch pattern: `main`
- [x] Require a pull request before merging (1 approval from `@BrizueIa`)
- [x] Dismiss stale approvals when new commits are pushed
- [x] Require status checks to pass before merging (`frontend-gate`, `rust-gate`)
- [x] Restrict who can push to matching branches (Only `@BrizueIa`)
- [x] Require linear history
- [x] Prevent force pushes and branch deletions

### For `dev`:
- [x] Branch pattern: `dev`
- [x] Require a pull request before merging (1 approval from `@BrizueIa`)
- [x] Dismiss stale approvals when new commits are pushed
- [x] Require status checks to pass before merging (`frontend-gate`, `rust-gate`)
- [x] Prevent force pushes and branch deletions
