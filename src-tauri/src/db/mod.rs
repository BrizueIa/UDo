pub mod migrations;
pub mod notes_repo;

use rusqlite::{params, Connection, Result};
use std::fs;
use std::path::PathBuf;
use crate::models::{FolderItem, InitialData, NoteItem, SubjectItem};

pub struct DatabaseManager {
    db_path: PathBuf,
}

impl DatabaseManager {
    pub fn new_with_path(db_path: PathBuf) -> Result<Self> {
        if let Some(parent) = db_path.parent() {
            fs::create_dir_all(parent).ok();
        }
        let manager = Self { db_path };
        let conn = manager.get_connection()?;
        migrations::init_schema(&conn)?;
        Ok(manager)
    }

    pub fn new() -> Result<Self> {
        let mut data_dir = dirs::data_local_dir().unwrap_or_else(|| PathBuf::from("."));
        data_dir.push("udo");
        Self::new_with_path(data_dir.join("udo.db"))
    }

    pub fn get_connection(&self) -> Result<Connection> {
        let conn = Connection::open(&self.db_path)?;
        conn.execute_batch(
            "PRAGMA foreign_keys = ON; PRAGMA journal_mode = WAL; PRAGMA busy_timeout = 5000; PRAGMA synchronous = NORMAL;",
        )?;
        Ok(conn)
    }

    pub fn get_initial_data(&self) -> Result<InitialData> {
        let conn = self.get_connection()?;
        
        let mut subjects_stmt = conn.prepare(
            "SELECT id, name, color, icon, sort_order, is_private FROM subjects ORDER BY sort_order ASC",
        )?;
        let subjects = subjects_stmt
            .query_map([], |row| {
                let is_priv: i32 = row.get(5).unwrap_or(0);
                Ok(SubjectItem {
                    id: row.get(0)?,
                    name: row.get(1)?,
                    color: row.get(2)?,
                    icon: row.get(3)?,
                    order: row.get(4)?,
                    is_private: is_priv != 0,
                })
            })?
            .collect::<Result<Vec<_>, _>>()?;

        let mut folders_stmt = conn.prepare(
            "SELECT id, subject_id, name, is_expanded, sort_order, is_private FROM folders ORDER BY sort_order ASC",
        )?;
        let folders = folders_stmt
            .query_map([], |row| {
                let is_expanded_int: i32 = row.get(3)?;
                let is_priv: i32 = row.get(5).unwrap_or(0);
                Ok(FolderItem {
                    id: row.get(0)?,
                    subject_id: row.get(1)?,
                    name: row.get(2)?,
                    is_expanded: is_expanded_int != 0,
                    order: row.get(4)?,
                    is_private: is_priv != 0,
                })
            })?
            .collect::<Result<Vec<_>, _>>()?;

        let notes = notes_repo::get_all_notes(&conn)?;

        Ok(InitialData {
            subjects,
            folders,
            notes,
        })
    }

    pub fn search_notes(&self, query: &str, include_private: bool) -> Result<Vec<NoteItem>> {
        let conn = self.get_connection()?;
        notes_repo::search_notes(&conn, query, include_private)
    }

    pub fn save_note(&self, note: &NoteItem) -> Result<()> {
        let conn = self.get_connection()?;
        notes_repo::save_note(&conn, note)
    }

    pub fn delete_note(&self, id: &str) -> Result<()> {
        let conn = self.get_connection()?;
        notes_repo::delete_note(&conn, id)
    }

    pub fn get_deleted_notes(&self, include_private: bool) -> Result<Vec<NoteItem>> {
        let conn = self.get_connection()?;
        notes_repo::get_deleted_notes(&conn, include_private)
    }

    pub fn restore_note(&self, id: &str) -> Result<()> {
        let conn = self.get_connection()?;
        notes_repo::restore_note(&conn, id)
    }

    pub fn restore_notes_batch(&self, ids: &[String]) -> Result<()> {
        let conn = self.get_connection()?;
        notes_repo::restore_notes_batch(&conn, ids)
    }

    pub fn permanently_delete_notes(&self, ids: &[String]) -> Result<()> {
        let conn = self.get_connection()?;
        notes_repo::permanently_delete_notes(&conn, ids)
    }

    pub fn empty_trash(&self, include_private: bool) -> Result<()> {
        let conn = self.get_connection()?;
        notes_repo::empty_trash(&conn, include_private)
    }

    pub fn get_setting(&self, key: &str) -> Result<Option<String>> {
        let conn = self.get_connection()?;
        let mut stmt = conn.prepare("SELECT value FROM app_settings WHERE key = ?1")?;
        let mut rows = stmt.query(params![key])?;
        if let Some(row) = rows.next()? {
            Ok(Some(row.get(0)?))
        } else {
            Ok(None)
        }
    }

    pub fn set_setting(&self, key: &str, value: &str) -> Result<()> {
        let conn = self.get_connection()?;
        conn.execute(
            "INSERT INTO app_settings (key, value) VALUES (?1, ?2)
             ON CONFLICT(key) DO UPDATE SET value=excluded.value;",
            params![key, value],
        )?;
        Ok(())
    }

    pub fn save_subject(&self, subject: &SubjectItem) -> Result<()> {
        let conn = self.get_connection()?;
        let is_priv = if subject.is_private { 1 } else { 0 };
        conn.execute(
            "INSERT INTO subjects (id, name, color, icon, sort_order, is_private)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6)
             ON CONFLICT(id) DO UPDATE SET
             name=excluded.name,
             color=excluded.color,
             icon=excluded.icon,
             sort_order=excluded.sort_order,
             is_private=excluded.is_private;",
            params![subject.id, subject.name, subject.color, subject.icon, subject.order, is_priv],
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
        let is_priv = if folder.is_private { 1 } else { 0 };
        conn.execute(
            "INSERT INTO folders (id, subject_id, name, is_expanded, sort_order, is_private)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6)
             ON CONFLICT(id) DO UPDATE SET
             subject_id=excluded.subject_id,
             name=excluded.name,
             is_expanded=excluded.is_expanded,
             sort_order=excluded.sort_order,
             is_private=excluded.is_private;",
            params![
                folder.id,
                folder.subject_id,
                folder.name,
                if folder.is_expanded { 1 } else { 0 },
                folder.order,
                is_priv
            ],
        )?;
        Ok(())
    }

    pub fn delete_folder(&self, id: &str) -> Result<()> {
        let conn = self.get_connection()?;
        let now = chrono::Utc::now().to_rfc3339();
        conn.execute(
            "UPDATE notes SET is_deleted = 1, folder_id = NULL, updated_at = ?2 WHERE folder_id = ?1 AND is_deleted = 0",
            params![id, now],
        )?;
        conn.execute("DELETE FROM folders WHERE id = ?1", params![id])?;
        Ok(())
    }
}
