use rusqlite::{Connection, Result};

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

    // Mark initial setup as completed so database starts 100% clean
    let has_initialized: bool = conn
        .query_row(
            "SELECT count(*) FROM app_settings WHERE key = 'initial_seed_completed'",
            [],
            |r| r.get::<_, i64>(0),
        )
        .map(|c| c > 0)
        .unwrap_or(false);

    if !has_initialized {
        conn.execute(
            "INSERT OR REPLACE INTO app_settings (key, value) VALUES ('initial_seed_completed', '1');",
            [],
        )?;
    }

    Ok(())
}
