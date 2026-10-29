use udo_lib::db::DatabaseManager;
use udo_lib::models::NoteItem;

#[test]
fn test_database_init_and_search() {
    let db = DatabaseManager::new().expect("Failed to initialize DatabaseManager");
    let initial = db.get_initial_data().expect("Failed to load initial data");
    assert!(!initial.subjects.is_empty(), "Subjects should not be empty");

    // Ensure a self-contained test note with diacritics exists
    let test_calculo_note = NoteItem {
        id: "note-test-calculo".to_string(),
        folder_id: initial.folders[0].id.clone(),
        subject_id: initial.subjects[0].id.clone(),
        title: "Cálculo de presupuestos".to_string(),
        content: "Cálculo automático de filamento.".to_string(),
        is_completed: false,
        is_pinned: false,
        tags: vec!["Presupuesto".to_string()],
        links: vec![],
        sketches: vec![],
        created_at: "2026-10-27T00:00:00Z".to_string(),
        updated_at: "2026-10-27T00:00:00Z".to_string(),
        due_date: None,
        focus_minutes: None,
        order: Some(0),
    };
    db.save_note(&test_calculo_note).expect("Failed to save test calculo note");

    // Verify diacritic-insensitive search ("calculo" finds "Cálculo", "diseno" finds "Diseños")
    let results_calculo = db.search_notes("calculo").expect("Search 'calculo' failed");
    assert!(
        results_calculo.iter().any(|n| n.content.contains("Cálculo") || n.title.contains("Cálculo")),
        "Search for 'calculo' should find note with 'Cálculo'"
    );

    let results_diseno = db.search_notes("diseno").expect("Search 'diseno' failed");
    assert!(
        results_diseno.iter().any(|n| n.title.contains("Diseños") || n.content.contains("Diseños")),
        "Search for 'diseno' should find note with 'Diseños'"
    );

    // Test saving new note and automatic trigger synchronization with FTS5
    let new_note = NoteItem {
        id: format!(
            "note-test-{}",
            std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap()
                .as_millis()
        ),
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
        order: Some(0),
    };

    db.save_note(&new_note).expect("Failed to save note");

    let search_robotics = db.search_notes("Quantum").expect("Search Quantum failed");
    assert!(
        search_robotics.iter().any(|n| n.id == new_note.id),
        "Should find new note by title or tag via FTS5"
    );

    // Soft delete and verify excluded from search
    db.delete_note(&new_note.id).expect("Failed to delete note");
    let search_after_delete = db.search_notes("Quantum").expect("Search after delete failed");
    assert!(
        !search_after_delete.iter().any(|n| n.id == new_note.id),
        "Soft-deleted note should be excluded from search"
    );
}
