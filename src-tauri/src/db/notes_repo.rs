use rusqlite::{params, Connection, Result};
use crate::models::{LinkItem, NoteAttachment, NoteItem, SketchItem};

pub fn map_note_row(row: &rusqlite::Row) -> Result<NoteItem> {
    let is_comp_int: i32 = row.get(5)?;
    let is_pin_int: i32 = row.get(6)?;
    let tags_str: String = row.get(7)?;
    let links_str: String = row.get(8)?;
    let sketches_str: String = row.get(9)?;
    let attachments_str: String = row.get(15).unwrap_or_else(|_| "[]".to_string());

    let tags: Vec<String> = serde_json::from_str(&tags_str).unwrap_or_default();
    let links: Vec<LinkItem> = serde_json::from_str(&links_str).unwrap_or_default();
    let sketches: Vec<SketchItem> = serde_json::from_str(&sketches_str).unwrap_or_default();
    let attachments: Vec<NoteAttachment> = serde_json::from_str(&attachments_str).unwrap_or_default();
    let sort_order: i32 = row.get(14).unwrap_or(0);

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
        attachments,
        created_at: row.get(10)?,
        updated_at: row.get(11)?,
        due_date: row.get(12)?,
        focus_minutes: row.get(13)?,
        order: Some(sort_order),
    })
}

pub fn get_all_notes(conn: &Connection) -> Result<Vec<NoteItem>> {
    let mut notes_stmt = conn.prepare(
        "SELECT id, folder_id, subject_id, title, content, is_completed, is_pinned,
                tags_json, links_json, sketches_json, created_at, updated_at, due_date,
                focus_minutes, sort_order, attachments_json
         FROM notes
         WHERE is_deleted = 0
         ORDER BY is_pinned DESC, sort_order ASC, updated_at DESC",
    )?;
    let notes = notes_stmt
        .query_map([], map_note_row)?
        .collect::<Result<Vec<_>, _>>()?;
    Ok(notes)
}

pub fn search_notes(conn: &Connection, query: &str) -> Result<Vec<NoteItem>> {
    let trimmed = query.trim();
    if trimmed.is_empty() {
        return Ok(Vec::new());
    }

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
                   notes.focus_minutes, notes.sort_order, notes.attachments_json
            FROM notes
            JOIN notes_fts ON notes.rowid = notes_fts.rowid
            WHERE notes.is_deleted = 0 AND notes_fts MATCH ?1
            ORDER BY rank
            LIMIT 50;
        ";

        if let Ok(mut stmt) = conn.prepare(fts_sql) {
            let results = stmt.query_map(params![fts_query], map_note_row);
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
                focus_minutes, sort_order, attachments_json
         FROM notes
         WHERE is_deleted = 0 AND (
             title LIKE ?1 OR
             content LIKE ?1 OR
             tags_json LIKE ?1
         )
         ORDER BY is_pinned DESC, sort_order ASC, updated_at DESC
         LIMIT 50",
    )?;

    let notes = stmt
        .query_map(params![like_pattern], map_note_row)?
        .collect::<Result<Vec<_>, _>>()?;

    Ok(notes)
}

pub fn save_note(conn: &Connection, note: &NoteItem) -> Result<()> {
    let tags_json = serde_json::to_string(&note.tags).unwrap_or_else(|_| "[]".to_string());
    let links_json = serde_json::to_string(&note.links).unwrap_or_else(|_| "[]".to_string());
    let sketches_json = serde_json::to_string(&note.sketches).unwrap_or_else(|_| "[]".to_string());
    let attachments_json = serde_json::to_string(&note.attachments).unwrap_or_else(|_| "[]".to_string());
    let sort_order = note.order.unwrap_or(0);

    conn.execute(
        "INSERT INTO notes (id, folder_id, subject_id, title, content, is_completed, is_pinned,
                            tags_json, links_json, sketches_json, attachments_json,
                            created_at, updated_at, due_date, focus_minutes, sort_order, is_deleted)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14, ?15, ?16, 0)
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
         attachments_json=excluded.attachments_json,
         updated_at=excluded.updated_at,
         due_date=excluded.due_date,
         focus_minutes=excluded.focus_minutes,
         sort_order=excluded.sort_order,
         is_deleted=0;",
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
            attachments_json,
            note.created_at,
            note.updated_at,
            note.due_date,
            note.focus_minutes,
            sort_order
        ],
    )?;

    Ok(())
}

pub fn delete_note(conn: &Connection, id: &str) -> Result<()> {
    conn.execute("UPDATE notes SET is_deleted = 1 WHERE id = ?1", params![id])?;
    Ok(())
}
