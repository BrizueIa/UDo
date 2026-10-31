use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct LinkItem {
    pub id: String,
    pub title: String,
    pub url: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct SketchItem {
    pub id: String,
    pub title: String,
    #[serde(rename = "dataUrl")]
    pub data_url: String,
    #[serde(default)]
    pub width: Option<u32>,
    #[serde(default)]
    pub height: Option<u32>,
    #[serde(rename = "posX", default)]
    pub pos_x: Option<f64>,
    #[serde(rename = "posY", default)]
    pub pos_y: Option<f64>,
    #[serde(rename = "zIndex", default)]
    pub z_index: Option<i32>,
    #[serde(rename = "wrapMode", default)]
    pub wrap_mode: Option<String>,
    #[serde(rename = "isBackground", default)]
    pub is_background: Option<bool>,
    #[serde(rename = "createdAt")]
    pub created_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct NoteAttachment {
    pub id: String,
    pub name: String,
    #[serde(rename = "filePath")]
    pub file_path: String,
    #[serde(rename = "mimeType")]
    pub mime_type: String,
    #[serde(rename = "sizeBytes")]
    pub size_bytes: u64,
    pub extension: String,
    pub kind: String, // "file" | "audio"
    #[serde(rename = "durationSeconds", default)]
    pub duration_seconds: Option<f64>,
    #[serde(default)]
    pub width: Option<u32>,
    #[serde(default)]
    pub height: Option<u32>,
    #[serde(rename = "posX", default)]
    pub pos_x: Option<f64>,
    #[serde(rename = "posY", default)]
    pub pos_y: Option<f64>,
    #[serde(rename = "zIndex", default)]
    pub z_index: Option<i32>,
    #[serde(rename = "isBackground", default)]
    pub is_background: Option<bool>,
    #[serde(rename = "createdAt")]
    pub created_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NoteItem {
    pub id: String,
    #[serde(rename = "folderId", default)]
    pub folder_id: String,
    #[serde(rename = "subjectId")]
    pub subject_id: String,
    pub title: String,
    pub content: String,
    #[serde(rename = "isCompleted")]
    pub is_completed: bool,
    #[serde(rename = "isPinned")]
    pub is_pinned: bool,
    pub tags: Vec<String>,
    pub links: Vec<LinkItem>,
    pub sketches: Vec<SketchItem>,
    #[serde(default)]
    pub attachments: Vec<NoteAttachment>,
    #[serde(rename = "createdAt")]
    pub created_at: String,
    #[serde(rename = "updatedAt")]
    pub updated_at: String,
    #[serde(rename = "dueDate")]
    pub due_date: Option<String>,
    #[serde(rename = "focusMinutes")]
    pub focus_minutes: Option<u32>,
    #[serde(rename = "order", default)]
    pub order: Option<i32>,
    #[serde(rename = "isPrivate", default)]
    pub is_private: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FolderItem {
    pub id: String,
    #[serde(rename = "subjectId")]
    pub subject_id: String,
    pub name: String,
    #[serde(rename = "isExpanded")]
    pub is_expanded: bool,
    pub order: i32,
    #[serde(rename = "isPrivate", default)]
    pub is_private: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SubjectItem {
    pub id: String,
    pub name: String,
    pub color: String,
    pub icon: Option<String>,
    pub order: i32,
    #[serde(rename = "isPrivate", default)]
    pub is_private: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BackupInfo {
    pub filename: String,
    pub path: String,
    #[serde(rename = "sizeBytes")]
    pub size_bytes: u64,
    #[serde(rename = "createdAt")]
    pub created_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct InitialData {
    pub subjects: Vec<SubjectItem>,
    pub folders: Vec<FolderItem>,
    pub notes: Vec<NoteItem>,
}
