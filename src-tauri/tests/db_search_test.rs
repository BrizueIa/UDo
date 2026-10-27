use udo_lib::db::DatabaseManager;
use udo_lib::models::NoteItem;

#[test]
fn test_database_init_and_search() {
    let db = DatabaseManager::new().expect("Failed to initialize DatabaseManager");
    let initial = db.get_initial_data().expect("Failed to load initial data");
    assert!(!initial.subjects.is_empty(), "Subjects should not be empty");

    // Search for seeded note (e.g. "Diseños" or "Menta")
    let results = db.search_notes("Diseños").expect("Search failed");
    assert!(!results.is_empty(), "Should find notes matching 'Diseños'");

    // Test saving new note and automatic trigger synchronization with FTS5
    let new_note = NoteItem {
        id: format!("note-test-{}", std::time::SystemTime::now().duration_since(std::time::UNIX_EPOCH).unwrap().as_millis()),
        folder_id: initial.folders[0].id.clone(),
        subject_id: initial.subjects[0].id.clone(),
        title: "Quantum Robotics Note".to_string(),
        content: "Testing SQLite FTS5 synchronization triggers automatically.".to_string(),
        is_completed: false,
        is_pinned: false,
        tags: vec!["Robotics".to_string(), "Quantum".to_string()],
        links: vec![],
        sketches: vec![],
        created_at: "2026-10-27T00:00:00Z".to_string(),
        updated_at: "2026-10-27T00:00:00Z".to_string(),
        due_date: None,
        focus_minutes: None,
    };

    db.save_note(&new_note).expect("Failed to save note");

    let search_robotics = db.search_notes("Quantum").expect("Search Quantum failed");
    assert!(search_robotics.iter().any(|n| n.id == new_note.id), "Should find new note by title or tag via FTS5");

    // Soft delete and verify excluded from search
    db.delete_note(&new_note.id).expect("Failed to delete note");
    let after_delete = db.search_notes("Quantum").expect("Search after delete failed");
    assert!(!after_delete.iter().any(|n| n.id == new_note.id), "Deleted note should not appear in search results");
}
