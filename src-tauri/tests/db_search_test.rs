use udo_lib::db::DatabaseManager;
use udo_lib::models::NoteItem;

#[test]
fn test_database_init_and_search() {
    let now = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap()
        .as_nanos();
    let temp_path = std::env::temp_dir().join(format!("udo-search-test-{}.db", now));
    let db = DatabaseManager::new_with_path(temp_path.clone()).expect("Failed to initialize test DatabaseManager");
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
        attachments: vec![],
        created_at: "2026-10-27T00:00:00Z".to_string(),
        updated_at: "2026-10-27T00:00:00Z".to_string(),
        due_date: None,
        focus_minutes: None,
        order: Some(0),
    };
    db.save_note(&test_calculo_note).expect("Failed to save test calculo note");

    // Verify diacritic-insensitive search ("calculo" finds "Cálculo", "diseno" finds "Diseños")
    let results_calculo = db.search_notes("calculo", true).expect("Search 'calculo' failed");
    assert!(
        results_calculo.iter().any(|n| n.content.contains("Cálculo") || n.title.contains("Cálculo")),
        "Search for 'calculo' should find note with 'Cálculo'"
    );

    let results_diseno = db.search_notes("diseno", true).expect("Search 'diseno' failed");
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
        attachments: vec![],
        created_at: "2026-10-27T00:00:00Z".to_string(),
        updated_at: "2026-10-27T00:00:00Z".to_string(),
        due_date: None,
        focus_minutes: None,
        order: Some(0),
    };

    db.save_note(&new_note).expect("Failed to save note");

    let search_robotics = db.search_notes("Quantum", true).expect("Search Quantum failed");
    assert!(
        search_robotics.iter().any(|n| n.id == new_note.id),
        "Should find new note by title or tag via FTS5"
    );

    // Soft delete and verify excluded from search
    db.delete_note(&new_note.id).expect("Failed to delete note");
    let search_after_delete = db.search_notes("Quantum", true).expect("Search after delete failed");
    assert!(
        !search_after_delete.iter().any(|n| n.id == new_note.id),
        "Soft-deleted note should be excluded from search"
    );

    // Test advanced search by attachment name and extension
    let note_with_cv = NoteItem {
        id: "note-test-attachment-cv".to_string(),
        folder_id: initial.folders[0].id.clone(),
        subject_id: initial.subjects[0].id.clone(),
        title: "Nota con Documentos".to_string(),
        content: "Sin palabras clave en texto.".to_string(),
        is_completed: false,
        is_pinned: false,
        tags: vec![],
        links: vec![],
        sketches: vec![udo_lib::models::SketchItem {
            id: "sk-1".to_string(),
            title: "Boceto de Circuito".to_string(),
            data_url: "data:...".to_string(),
            created_at: "2026-10-27T00:00:00Z".to_string(),
        }],
        attachments: vec![
            udo_lib::models::NoteAttachment {
                id: "att-cv-1".to_string(),
                name: "CV_BrizuelaGonzalezGustavoAdrian.pdf".to_string(),
                file_path: "/dummy/path/CV_BrizuelaGonzalezGustavoAdrian.pdf".to_string(),
                mime_type: "application/pdf".to_string(),
                size_bytes: 1024,
                extension: "pdf".to_string(),
                kind: "file".to_string(),
                duration_seconds: None,
                created_at: "2026-10-27T00:00:00Z".to_string(),
            },
            udo_lib::models::NoteAttachment {
                id: "att-voice-1".to_string(),
                name: "voice-note.webm".to_string(),
                file_path: "/dummy/path/voice-note.webm".to_string(),
                mime_type: "audio/webm".to_string(),
                size_bytes: 2048,
                extension: "webm".to_string(),
                kind: "audio".to_string(),
                duration_seconds: Some(5.0),
                created_at: "2026-10-27T00:00:00Z".to_string(),
            },
        ],
        created_at: "2026-10-27T00:00:00Z".to_string(),
        updated_at: "2026-10-27T00:00:00Z".to_string(),
        due_date: None,
        focus_minutes: None,
        order: Some(0),
    };
    db.save_note(&note_with_cv).expect("Failed to save note with attachments");

    // 1. Search by attachment filename "cv"
    let search_cv = db.search_notes("cv", true).expect("Search 'cv' failed");
    assert!(
        search_cv.iter().any(|n| n.id == "note-test-attachment-cv"),
        "Search for 'cv' should find note with CV attachment"
    );

    // 2. Search by extension ".pdf"
    let search_pdf = db.search_notes(".pdf", true).expect("Search '.pdf' failed");
    assert!(
        search_pdf.iter().any(|n| n.id == "note-test-attachment-cv"),
        "Search for '.pdf' should find note with PDF attachment"
    );

    // 3. Search by audio ".audio"
    let search_audio = db.search_notes(".audio", true).expect("Search '.audio' failed");
    assert!(
        search_audio.iter().any(|n| n.id == "note-test-attachment-cv"),
        "Search for '.audio' should find note with audio attachment"
    );

    // 4. Search by canvas ".canvas"
    let search_canvas = db.search_notes(".canvas", true).expect("Search '.canvas' failed");
    assert!(
        search_canvas.iter().any(|n| n.id == "note-test-attachment-cv"),
        "Search for '.canvas' should find note with sketches"
    );

    // 5. Test root project note (note without folder)
    let root_note = NoteItem {
        id: "note-root-project".to_string(),
        folder_id: "".to_string(),
        subject_id: initial.subjects[0].id.clone(),
        title: "Nota en raíz de proyecto".to_string(),
        content: "Contenido directo en el proyecto sin carpeta.".to_string(),
        is_completed: false,
        is_pinned: true,
        tags: vec!["Raiz".to_string()],
        links: vec![],
        sketches: vec![],
        attachments: vec![],
        created_at: "2026-10-27T00:00:00Z".to_string(),
        updated_at: "2026-10-27T00:00:00Z".to_string(),
        due_date: None,
        focus_minutes: None,
        order: Some(0),
    };
    db.save_note(&root_note).expect("Failed to save root note without folder");

    let all_notes = db.get_initial_data().expect("Failed to fetch data").notes;
    let saved_root = all_notes.iter().find(|n| n.id == "note-root-project").expect("Root note not found in DB");
    assert_eq!(saved_root.folder_id, "", "Root note folder_id should be empty");
    assert_eq!(saved_root.title, "Nota en raíz de proyecto");

    std::fs::remove_file(temp_path).ok();
}
