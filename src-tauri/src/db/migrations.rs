use rusqlite::{params, Connection, Result};

pub fn init_schema(conn: &Connection) -> Result<()> {
    // Execute core table schema
    conn.execute_batch(
        "
        CREATE TABLE IF NOT EXISTS subjects (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            color TEXT NOT NULL,
            icon TEXT,
            sort_order INTEGER NOT NULL DEFAULT 0,
            is_private INTEGER NOT NULL DEFAULT 0
        );

        CREATE TABLE IF NOT EXISTS app_settings (
            key TEXT PRIMARY KEY,
            value TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS folders (
            id TEXT PRIMARY KEY,
            subject_id TEXT NOT NULL,
            name TEXT NOT NULL,
            is_expanded INTEGER NOT NULL DEFAULT 1,
            sort_order INTEGER NOT NULL DEFAULT 0,
            is_private INTEGER NOT NULL DEFAULT 0,
            FOREIGN KEY(subject_id) REFERENCES subjects(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS notes (
            id TEXT PRIMARY KEY,
            folder_id TEXT,
            subject_id TEXT NOT NULL,
            title TEXT NOT NULL,
            content TEXT NOT NULL,
            is_completed INTEGER NOT NULL DEFAULT 0,
            is_pinned INTEGER NOT NULL DEFAULT 0,
            tags_json TEXT NOT NULL DEFAULT '[]',
            links_json TEXT NOT NULL DEFAULT '[]',
            sketches_json TEXT NOT NULL DEFAULT '[]',
            attachments_json TEXT NOT NULL DEFAULT '[]',
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            due_date TEXT,
            focus_minutes INTEGER,
            sort_order INTEGER NOT NULL DEFAULT 0,
            is_deleted INTEGER NOT NULL DEFAULT 0,
            is_private INTEGER NOT NULL DEFAULT 0,
            FOREIGN KEY(folder_id) REFERENCES folders(id) ON DELETE SET NULL,
            FOREIGN KEY(subject_id) REFERENCES subjects(id) ON DELETE CASCADE
        );

        CREATE VIRTUAL TABLE IF NOT EXISTS notes_fts USING fts5(
            title, content, tags_json, content='notes', content_rowid='rowid',
            tokenize = 'unicode61 remove_diacritics 2'
        );

        CREATE TRIGGER IF NOT EXISTS notes_ai AFTER INSERT ON notes BEGIN
            INSERT INTO notes_fts(rowid, title, content, tags_json)
            VALUES (new.rowid, new.title, new.content, new.tags_json);
        END;

        CREATE TRIGGER IF NOT EXISTS notes_ad AFTER DELETE ON notes BEGIN
            INSERT INTO notes_fts(notes_fts, rowid, title, content, tags_json)
            VALUES ('delete', old.rowid, old.title, old.content, old.tags_json);
        END;

        CREATE TRIGGER IF NOT EXISTS notes_au AFTER UPDATE ON notes BEGIN
            INSERT INTO notes_fts(notes_fts, rowid, title, content, tags_json)
            VALUES ('delete', old.rowid, old.title, old.content, old.tags_json);
            INSERT INTO notes_fts(rowid, title, content, tags_json)
            VALUES (new.rowid, new.title, new.content, new.tags_json);
        END;
        ",
    )?;

    // Check and apply idempotent migrations for existing databases
    let mut pragma = conn.prepare("PRAGMA table_info(notes)")?;
    let columns = pragma
        .query_map([], |row| row.get::<_, String>(1))?
        .collect::<Result<Vec<_>, _>>()?;

    if !columns.contains(&"sort_order".to_string()) {
        conn.execute(
            "ALTER TABLE notes ADD COLUMN sort_order INTEGER NOT NULL DEFAULT 0;",
            [],
        )?;
    }

    if !columns.contains(&"attachments_json".to_string()) {
        conn.execute(
            "ALTER TABLE notes ADD COLUMN attachments_json TEXT NOT NULL DEFAULT '[]';",
            [],
        )?;
    }

    if !columns.contains(&"is_private".to_string()) {
        conn.execute(
            "ALTER TABLE notes ADD COLUMN is_private INTEGER NOT NULL DEFAULT 0;",
            [],
        )?;
    }

    let mut pragma_sub = conn.prepare("PRAGMA table_info(subjects)")?;
    let sub_columns = pragma_sub
        .query_map([], |row| row.get::<_, String>(1))?
        .collect::<Result<Vec<_>, _>>()?;

    if !sub_columns.contains(&"is_private".to_string()) {
        conn.execute(
            "ALTER TABLE subjects ADD COLUMN is_private INTEGER NOT NULL DEFAULT 0;",
            [],
        )?;
    }

    let mut pragma_fold = conn.prepare("PRAGMA table_info(folders)")?;
    let fold_columns = pragma_fold
        .query_map([], |row| row.get::<_, String>(1))?
        .collect::<Result<Vec<_>, _>>()?;

    if !fold_columns.contains(&"is_private".to_string()) {
        conn.execute(
            "ALTER TABLE folders ADD COLUMN is_private INTEGER NOT NULL DEFAULT 0;",
            [],
        )?;
    }

    // Migration: Allow nullable folder_id for root project notes
    let mut pragma_notes = conn.prepare("PRAGMA table_info(notes)")?;
    let folder_id_not_null = pragma_notes
        .query_map([], |row| {
            let name: String = row.get(1)?;
            let notnull: i64 = row.get(3)?;
            Ok((name, notnull))
        })?
        .any(|col| matches!(col, Ok((name, notnull)) if name == "folder_id" && notnull == 1));

    if folder_id_not_null {
        conn.execute_batch(
            "
            PRAGMA foreign_keys = OFF;
            CREATE TABLE notes_mig (
                id TEXT PRIMARY KEY,
                folder_id TEXT,
                subject_id TEXT NOT NULL,
                title TEXT NOT NULL,
                content TEXT NOT NULL,
                is_completed INTEGER NOT NULL DEFAULT 0,
                is_pinned INTEGER NOT NULL DEFAULT 0,
                tags_json TEXT NOT NULL DEFAULT '[]',
                links_json TEXT NOT NULL DEFAULT '[]',
                sketches_json TEXT NOT NULL DEFAULT '[]',
                attachments_json TEXT NOT NULL DEFAULT '[]',
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL,
                due_date TEXT,
                focus_minutes INTEGER,
                sort_order INTEGER NOT NULL DEFAULT 0,
                is_deleted INTEGER NOT NULL DEFAULT 0,
                FOREIGN KEY(folder_id) REFERENCES folders(id) ON DELETE SET NULL,
                FOREIGN KEY(subject_id) REFERENCES subjects(id) ON DELETE CASCADE
            );
            INSERT INTO notes_mig SELECT 
                id, folder_id, subject_id, title, content, is_completed, is_pinned, 
                tags_json, links_json, sketches_json, attachments_json, created_at, 
                updated_at, due_date, focus_minutes, sort_order, is_deleted 
            FROM notes;
            DROP TABLE notes;
            ALTER TABLE notes_mig RENAME TO notes;

            CREATE TRIGGER IF NOT EXISTS notes_ai AFTER INSERT ON notes BEGIN
                INSERT INTO notes_fts(rowid, title, content, tags_json)
                VALUES (new.rowid, new.title, new.content, new.tags_json);
            END;

            CREATE TRIGGER IF NOT EXISTS notes_ad AFTER DELETE ON notes BEGIN
                INSERT INTO notes_fts(notes_fts, rowid, title, content, tags_json)
                VALUES ('delete', old.rowid, old.title, old.content, old.tags_json);
            END;

            CREATE TRIGGER IF NOT EXISTS notes_au AFTER UPDATE ON notes BEGIN
                INSERT INTO notes_fts(notes_fts, rowid, title, content, tags_json)
                VALUES ('delete', old.rowid, old.title, old.content, old.tags_json);
                INSERT INTO notes_fts(rowid, title, content, tags_json)
                VALUES (new.rowid, new.title, new.content, new.tags_json);
            END;

            PRAGMA foreign_keys = ON;
            ",
        )?;
    }

    // Rebuild FTS index only when notes count does not match FTS index count
    let notes_count: i64 = conn.query_row("SELECT count(*) FROM notes", [], |r| r.get(0))?;
    if notes_count > 0 {
        let fts_count: i64 = conn
            .query_row("SELECT count(*) FROM notes_fts_docsize", [], |r| r.get(0))
            .unwrap_or(0);
        if fts_count != notes_count {
            conn.execute("INSERT INTO notes_fts(notes_fts) VALUES('rebuild');", [])?;
        }
    }

    // Seed default sample data ONLY if freshly created database and not previously seeded
    let has_seeded: bool = conn
        .query_row(
            "SELECT count(*) FROM app_settings WHERE key = 'initial_seed_completed'",
            [],
            |r| r.get::<_, i64>(0),
        )
        .map(|c| c > 0)
        .unwrap_or(false);

    if !has_seeded {
        let existing_subjects: i64 = conn
            .query_row("SELECT count(*) FROM subjects", [], |r| r.get(0))
            .unwrap_or(0);
        let existing_notes: i64 = conn
            .query_row("SELECT count(*) FROM notes", [], |r| r.get(0))
            .unwrap_or(0);

        if existing_subjects == 0 && existing_notes == 0 {
            seed_defaults(conn)?;
        }

        conn.execute(
            "INSERT OR REPLACE INTO app_settings (key, value) VALUES ('initial_seed_completed', '1');",
            [],
        )?;
    }

    Ok(())
}

fn seed_defaults(conn: &Connection) -> Result<()> {
    conn.execute(
        "INSERT OR IGNORE INTO subjects (id, name, color, sort_order, is_private) VALUES 
        ('subj-3d', '3D', '#f97316', 0, 0), ('subj-loteria', 'Lotería app', '#10b981', 1, 0), ('subj-stardew', 'StardewValley', '#6366f1', 2, 0);",
        [],
    )?;

    conn.execute(
        "INSERT OR IGNORE INTO folders (id, subject_id, name, is_expanded, sort_order, is_private) VALUES 
        ('fold-plantas', 'subj-3d', 'Plantas', 1, 0, 0), ('fold-eucce', 'subj-3d', 'EUCCE', 0, 1, 0);",
        [],
    )?;

    let sample_content = "### Ideas y Referencias de Diseños Botánicos\n\nExplorar macetas geométricas y articuladas con autorriego para plantas de interior.\n\n- [x] Dimensionar tolerancias para boquilla de 0.4mm\n- [ ] Diseñar depósito de agua con indicador visual de nivel\n- [ ] Probar filamento PLA mate color menta\n\n[embed:link:link-1]\n[embed:link:link-2]";
    let sample_sketch = r#"[{"id":"sketch-1","title":"Maceta Menta 3D","dataUrl":"data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 120 120\"><rect width=\"120\" height=\"120\" rx=\"16\" fill=\"%23ffffff\"/><path d=\"M50 40 Q40 25 35 32 Q35 48 48 45\" fill=\"%2322c55e\"/><path d=\"M42 55 L78 55 L72 90 L48 90 Z\" fill=\"%23a7f3d0\" stroke=\"%236ee7b7\" stroke-width=\"2\"/></svg>","createdAt":"2026-10-27T03:00:00Z"}]"#;
    let sample_links = r#"[{"id":"link-1","title":"Modelos en Printables","url":"https://www.printables.com"},{"id":"link-2","title":"Inspiración Pinterest Plantas","url":"https://pinterest.com"}]"#;

    conn.execute(
        "INSERT OR IGNORE INTO notes (id, folder_id, subject_id, title, content, is_completed, is_pinned, tags_json, links_json, sketches_json, attachments_json, created_at, updated_at, focus_minutes, is_private) VALUES 
        ('note-disenos', 'fold-plantas', 'subj-3d', 'Diseños', ?1, 0, 1, '[\"Modelado\",\"Prototipo\"]', ?2, ?3, '[]', '2026-10-27T02:00:00Z', 'Hoy, 10:15 AM', 25, 0),
        ('note-laminar', 'fold-plantas', 'subj-3d', 'Laminar', 'Configurar parámetros en OrcaSlicer.', 0, 0, '[\"Slicer\"]', '[]', '[]', '[]', '2026-10-27T02:10:00Z', 'Ayer', NULL, 0),
        ('note-costos', 'fold-plantas', 'subj-3d', 'Costos, presupuestos', 'Cálculo de consumo y filamento.', 0, 0, '[\"Presupuesto\"]', '[]', '[]', '[]', '2026-10-27T02:15:00Z', 'Ayer', NULL, 0),
        ('note-cotizacion', 'fold-plantas', 'subj-3d', 'Cotización', 'Aprobado por el cliente.', 1, 0, '[\"Cliente\"]', '[]', '[]', '[]', '2026-10-27T01:30:00Z', '24 Oct', NULL, 0);",
        params![sample_content, sample_links, sample_sketch],
    )?;

    Ok(())
}
