# Data Governance & Security Policy

**Project:** UDo  
**Architecture:** Local-First Software Architecture  
**Status:** Active  

---

## 1. Data Governance Principles

### 1.1 Exclusive User Ownership
All notes, sheets, images, sketches, tags, and configuration files created within UDo are the exclusive and inalienable intellectual property of the user. UDo functions solely as a local processor and viewer, asserting zero claim or license over your content.

### 1.2 Open, Non-Proprietary Formats
To prevent vendor lock-in, data is stored and exported in industry-standard open formats:
* **Notes & Text:** GitHub Flavored Markdown (GFM).
* **Structure & Metadata:** Relational SQLite / Human-readable structured JSON.
* **Images & Sketches:** Standard PNG / JPEG / WebP / SVG formats without proprietary encoding.

---

## 2. Security at Rest

1. **Linux File Permission Masking:**
   * Data directories at `~/.local/share/udo/` are created with strict user permission masks (`0700` for folders, `0600` for database files), preventing unprivileged system users from reading application data.
2. **Tauri Sandbox & Context Isolation:**
   * The web UI layer operates with full context isolation. Arbitrary disk access and unauthorized shell execution are blocked; all disk I/O passes through strictly-typed, audited Rust commands.
3. **Zero Script Injection:**
   * Markdown rendering automatically sanitizes raw HTML and scripts, eliminating local cross-site scripting (XSS) vectors.

---

## 3. Resilience & Backup Architecture

1. **Atomic Transactions:**
   * Database updates utilize ACID transactions (SQLite) and atomic temp-file swaps to protect against data corruption during power outages or sudden system reboots.
2. **Automated Daily Backups with Version Retention:**
   * Automated snapshot generation to the user-selected local backup folder (`~/Backups/udo/`).
   * Retains the last 7 daily revisions to safeguard against accidental deletions or erroneous edits.
3. **Trash Retention Window:**
   * Deleted notes are soft-deleted (`is_deleted = true`) and kept in a local Trash bin for 30 days before permanent deletion.
