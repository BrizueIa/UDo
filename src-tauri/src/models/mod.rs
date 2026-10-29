use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LinkItem {
    pub id: String,
    pub title: String,
    pub url: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SketchItem {
    pub id: String,
    pub title: String,
    #[serde(rename = "dataUrl")]
    pub data_url: String,
    #[serde(rename = "createdAt")]
    pub created_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NoteItem {
    pub id: String,
    #[serde(rename = "folderId")]
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
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SubjectItem {
    pub id: String,
    pub name: String,
    pub color: String,
    pub icon: Option<String>,
    pub order: i32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct InitialData {
    pub subjects: Vec<SubjectItem>,
    pub folders: Vec<FolderItem>,
    pub notes: Vec<NoteItem>,
}
