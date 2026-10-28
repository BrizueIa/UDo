use rusqlite::{params, Connection, Result};
use std::fs;
use std::path::PathBuf;
use crate::models::{FolderItem, InitialData, LinkItem, NoteItem, SketchItem, SubjectItem};

pub struct DatabaseManager {
    db_path: PathBuf,
}

impl DatabaseManager {
    pub fn new() -> Result<Self> {
        let mut data_dir = dirs::data_local_dir().unwrap_or_else(|| PathBuf::from("."));
        data_dir.push("udo");
        fs::create_dir_all(&data_dir).ok();
        
        let db_path = data_dir.join("udo.db");
        let manager = Self { db_path };
        manager.init_schema()?;
        Ok(manager)
    }

    fn get_connection(&self) -> Result<Connection> {
        let conn = Connection::open(&self.db_path)?;
        conn.execute_batch("PRAGMA foreign_keys = ON;")?;
        Ok(conn)
    }

    fn init_schema(&self) -> Result<()> {
        let conn = self.get_connection()?;
        
        // Execute migrations wrapped in a transaction
        conn.execute_batch(
            "
            CREATE TABLE IF NOT EXISTS subjects (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                color TEXT NOT NULL,
                icon TEXT,
                sort_order INTEGER NOT NULL DEFAULT 0
            );

            CREATE TABLE IF NOT EXISTS folders (
                id TEXT PRIMARY KEY,
                subject_id TEXT NOT NULL,
                name TEXT NOT NULL,
                is_expanded INTEGER NOT NULL DEFAULT 1,
                sort_order INTEGER NOT NULL DEFAULT 0,
                FOREIGN KEY(subject_id) REFERENCES subjects(id) ON DELETE CASCADE
            );

            CREATE TABLE IF NOT EXISTS notes (
                id TEXT PRIMARY KEY,
                folder_id TEXT NOT NULL,
                subject_id TEXT NOT NULL,
                title TEXT NOT NULL,
                content TEXT NOT NULL,
                is_completed INTEGER NOT NULL DEFAULT 0,
                is_pinned INTEGER NOT NULL DEFAULT 0,
                tags_json TEXT NOT NULL DEFAULT '[]',
                links_json TEXT NOT NULL DEFAULT '[]',
                sketches_json TEXT NOT NULL DEFAULT '[]',
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL,
                due_date TEXT,
                focus_minutes INTEGER,
                is_deleted INTEGER NOT NULL DEFAULT 0,
                FOREIGN KEY(folder_id) REFERENCES folders(id) ON DELETE CASCADE,
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

        // Seed default sample data if newly created database
        let count: i64 = conn.query_row("SELECT count(*) FROM subjects", [], |r| r.get(0))?;
        if count == 0 {
            self.seed_defaults(&conn)?;
        }

        Ok(())
    }

    fn seed_defaults(&self, conn: &Connection) -> Result<()> {
        // Seed default 3D, Lotería app, StardewValley matching reference screenshot
        conn.execute(
            "INSERT INTO subjects (id, name, color, sort_order) VALUES 
            ('subj-3d', '3D', '#f97316', 0),
            ('subj-loteria', 'Lotería app', '#10b981', 1),
            ('subj-stardew', 'StardewValley', '#6366f1', 2);",
            [],
        )?;

        conn.execute(
            "INSERT INTO folders (id, subject_id, name, is_expanded, sort_order) VALUES 
            ('fold-plantas', 'subj-3d', 'Plantas', 1, 0),
            ('fold-eucce', 'subj-3d', 'EUCCE', 0, 1);",
            [],
        )?;

        let sample_content = "### Ideas y Referencias de Diseños Botánicos\n\nExplorar macetas geométricas y articuladas con autorriego para plantas de interior.\n\n- [x] Dimensionar tolerancias para boquilla de 0.4mm\n- [ ] Diseñar depósito de agua con indicador visual de nivel\n- [ ] Probar filamento PLA mate color menta";
        let sample_sketch = r#"[{"id":"sketch-1","title":"Maceta Menta 3D","dataUrl":"data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 120 120\"><rect width=\"120\" height=\"120\" rx=\"16\" fill=\"%23ffffff\"/><path d=\"M50 40 Q40 25 35 32 Q35 48 48 45\" fill=\"%2322c55e\"/><path d=\"M42 55 L78 55 L72 90 L48 90 Z\" fill=\"%23a7f3d0\" stroke=\"%236ee7b7\" stroke-width=\"2\"/></svg>","createdAt":"2026-10-27T03:00:00Z"}]"#;
        let sample_links = r#"[{"id":"link-1","title":"Modelos en Printables","url":"https://www.printables.com"},{"id":"link-2","title":"Inspiración Pinterest Plantas","url":"https://pinterest.com"}]"#;

        conn.execute(
            "INSERT INTO notes (id, folder_id, subject_id, title, content, is_completed, is_pinned, tags_json, links_json, sketches_json, created_at, updated_at, focus_minutes) VALUES 
            ('note-disenos', 'fold-plantas', 'subj-3d', 'Diseños', ?1, 0, 1, '[\"Modelado\",\"Prototipo\"]', ?2, ?3, '2026-10-27T02:00:00Z', 'Hoy, 10:15 AM', 25),
            ('note-laminar', 'fold-plantas', 'subj-3d', 'Laminar', 'Configurar parámetros en OrcaSlicer.', 0, 0, '[\"Slicer\"]', '[]', '[]', '2026-10-27T02:10:00Z', 'Ayer', NULL),
            ('note-costos', 'fold-plantas', 'subj-3d', 'Costos, presupuestos', 'Cálculo de consumo y filamento.', 0, 0, '[\"Presupuesto\"]', '[]', '[]', '2026-10-27T02:15:00Z', 'Ayer', NULL),
            ('note-cotizacion', 'fold-plantas', 'subj-3d', 'Cotización', 'Aprobado por el cliente.', 1, 0, '[\"Cliente\"]', '[]', '[]', '2026-10-27T01:30:00Z', '24 Oct', NULL);",
            params![sample_content, sample_links, sample_sketch],
        )?;

        Ok(())
    }

    fn map_note_row(row: &rusqlite::Row) -> Result<NoteItem> {
        let is_comp_int: i32 = row.get(5)?;
        let is_pin_int: i32 = row.get(6)?;
        let tags_str: String = row.get(7)?;
        let links_str: String = row.get(8)?;
        let sketches_str: String = row.get(9)?;

        let tags: Vec<String> = serde_json::from_str(&tags_str).unwrap_or_default();
        let links: Vec<LinkItem> = serde_json::from_str(&links_str).unwrap_or_default();
        let sketches: Vec<SketchItem> = serde_json::from_str(&sketches_str).unwrap_or_default();

        Ok(NoteItem {
            id: row.get(0)?,
            folder_id: row.get(1)?,
            subject_id: row.get(2)?,
            title: row.get(3)?,
            content: row.get(4)?,
            is_completed: is_comp_int != 0,
            is_pinned: is_pin_int != 0,
            tags,
            links,
            sketches,
            created_at: row.get(10)?,
            updated_at: row.get(11)?,
            due_date: row.get(12)?,
            focus_minutes: row.get(13)?,
        })
    }

    pub fn get_initial_data(&self) -> Result<InitialData> {
        let conn = self.get_connection()?;
        
        let mut subjects_stmt = conn.prepare("SELECT id, name, color, icon, sort_order FROM subjects ORDER BY sort_order ASC")?;
        let subjects = subjects_stmt.query_map([], |row| {
            Ok(SubjectItem {
                id: row.get(0)?,
                name: row.get(1)?,
                color: row.get(2)?,
                icon: row.get(3)?,
                order: row.get(4)?,
            })
        })?.collect::<Result<Vec<_>, _>>()?;

        let mut folders_stmt = conn.prepare("SELECT id, subject_id, name, is_expanded, sort_order FROM folders ORDER BY sort_order ASC")?;
        let folders = folders_stmt.query_map([], |row| {
            let is_expanded_int: i32 = row.get(3)?;
            Ok(FolderItem {
                id: row.get(0)?,
                subject_id: row.get(1)?,
                name: row.get(2)?,
                is_expanded: is_expanded_int != 0,
                order: row.get(4)?,
            })
        })?.collect::<Result<Vec<_>, _>>()?;

        let mut notes_stmt = conn.prepare("SELECT id, folder_id, subject_id, title, content, is_completed, is_pinned, tags_json, links_json, sketches_json, created_at, updated_at, due_date, focus_minutes FROM notes WHERE is_deleted = 0 ORDER BY is_pinned DESC, updated_at DESC")?;
        let notes = notes_stmt.query_map([], Self::map_note_row)?.collect::<Result<Vec<_>, _>>()?;

        Ok(InitialData {
            subjects,
            folders,
            notes,
        })
    }

    pub fn search_notes(&self, query: &str) -> Result<Vec<NoteItem>> {
        let trimmed = query.trim();
        if trimmed.is_empty() {
            return Ok(Vec::new());
        }

        let conn = self.get_connection()?;

        // Tokenize query for SQLite FTS5 prefix matching
        let tokens: Vec<String> = trimmed
            .split_whitespace()
            .map(|token| {
                token
                    .chars()
                    .filter(|c| c.is_alphanumeric() || *c == '_' || *c == '-')
                    .collect::<String>()
            })
            .filter(|t| !t.is_empty())
            .map(|t| format!("\"{}\"*", t.replace('"', "\"\"")))
            .collect();

        let fts_query = tokens.join(" ");

        if !fts_query.is_empty() {
            let fts_sql = "
                SELECT notes.id, notes.folder_id, notes.subject_id, notes.title, notes.content,
                       notes.is_completed, notes.is_pinned, notes.tags_json, notes.links_json,
                       notes.sketches_json, notes.created_at, notes.updated_at, notes.due_date,
                       notes.focus_minutes
                FROM notes
                JOIN notes_fts ON notes.rowid = notes_fts.rowid
                WHERE notes.is_deleted = 0 AND notes_fts MATCH ?1
                ORDER BY rank
                LIMIT 50;
            ";

            if let Ok(mut stmt) = conn.prepare(fts_sql) {
                let results = stmt.query_map(params![fts_query], Self::map_note_row);
                if let Ok(mapped) = results {
                    let notes: Result<Vec<NoteItem>, _> = mapped.collect();
                    if let Ok(notes) = notes {
                        if !notes.is_empty() {
                            return Ok(notes);
                        }
                    }
                }
            }
        }

        // Fallback to LIKE query across title, content and tags
        let like_pattern = format!("%{}%", trimmed);
        let mut stmt = conn.prepare(
            "SELECT id, folder_id, subject_id, title, content,
                    is_completed, is_pinned, tags_json, links_json,
                    sketches_json, created_at, updated_at, due_date,
                    focus_minutes
             FROM notes
             WHERE is_deleted = 0 AND (
                 title LIKE ?1 OR
                 content LIKE ?1 OR
                 tags_json LIKE ?1
             )
             ORDER BY is_pinned DESC, updated_at DESC
             LIMIT 50",
        )?;

        let notes = stmt
            .query_map(params![like_pattern], Self::map_note_row)?
            .collect::<Result<Vec<_>, _>>()?;

        Ok(notes)
    }

    pub fn save_note(&self, note: &NoteItem) -> Result<()> {
        let conn = self.get_connection()?;
        let tags_json = serde_json::to_string(&note.tags).unwrap_or_else(|_| "[]".to_string());
        let links_json = serde_json::to_string(&note.links).unwrap_or_else(|_| "[]".to_string());
        let sketches_json = serde_json::to_string(&note.sketches).unwrap_or_else(|_| "[]".to_string());

        conn.execute(
            "INSERT INTO notes (id, folder_id, subject_id, title, content, is_completed, is_pinned, tags_json, links_json, sketches_json, created_at, updated_at, due_date, focus_minutes)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14)
             ON CONFLICT(id) DO UPDATE SET
             folder_id=excluded.folder_id,
             subject_id=excluded.subject_id,
             title=excluded.title,
             content=excluded.content,
             is_completed=excluded.is_completed,
             is_pinned=excluded.is_pinned,
             tags_json=excluded.tags_json,
             links_json=excluded.links_json,
             sketches_json=excluded.sketches_json,
             updated_at=excluded.updated_at,
             due_date=excluded.due_date,
             focus_minutes=excluded.focus_minutes;",
            params![
                note.id,
                note.folder_id,
                note.subject_id,
                note.title,
                note.content,
                if note.is_completed { 1 } else { 0 },
                if note.is_pinned { 1 } else { 0 },
                tags_json,
                links_json,
                sketches_json,
                note.created_at,
                note.updated_at,
                note.due_date,
                note.focus_minutes
            ],
        )?;

        Ok(())
    }

    pub fn delete_note(&self, id: &str) -> Result<()> {
        let conn = self.get_connection()?;
        // Soft delete (moves to trash)
        conn.execute("UPDATE notes SET is_deleted = 1 WHERE id = ?1", params![id])?;
        Ok(())
    }

    pub fn save_subject(&self, subject: &SubjectItem) -> Result<()> {
        let conn = self.get_connection()?;
        conn.execute(
            "INSERT INTO subjects (id, name, color, icon, sort_order)
             VALUES (?1, ?2, ?3, ?4, ?5)
             ON CONFLICT(id) DO UPDATE SET
             name=excluded.name,
             color=excluded.color,
             icon=excluded.icon,
             sort_order=excluded.sort_order;",
            params![subject.id, subject.name, subject.color, subject.icon, subject.order],
        )?;
        Ok(())
    }

    pub fn delete_subject(&self, id: &str) -> Result<()> {
        let conn = self.get_connection()?;
        conn.execute("DELETE FROM subjects WHERE id = ?1", params![id])?;
        Ok(())
    }

    pub fn save_folder(&self, folder: &FolderItem) -> Result<()> {
        let conn = self.get_connection()?;
        conn.execute(
            "INSERT INTO folders (id, subject_id, name, is_expanded, sort_order)
             VALUES (?1, ?2, ?3, ?4, ?5)
             ON CONFLICT(id) DO UPDATE SET
             subject_id=excluded.subject_id,
             name=excluded.name,
             is_expanded=excluded.is_expanded,
             sort_order=excluded.sort_order;",
            params![
                folder.id,
                folder.subject_id,
                folder.name,
                if folder.is_expanded { 1 } else { 0 },
                folder.order
            ],
        )?;
        Ok(())
    }

    pub fn delete_folder(&self, id: &str) -> Result<()> {
        let conn = self.get_connection()?;
        conn.execute("DELETE FROM folders WHERE id = ?1", params![id])?;
        Ok(())
    }
}
