use std::path::PathBuf;
use udo_lib::db::DatabaseManager;
use udo_lib::models::{NoteItem, SubjectItem};
use udo_lib::services::vault;

fn create_temp_db(name: &str) -> (DatabaseManager, PathBuf) {
    let now = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap()
        .as_nanos();
    let path = std::env::temp_dir().join(format!("udo-test-{}-{}.db", name, now));
    let db = DatabaseManager::new_with_path(path.clone()).expect("Failed to initialize test DB");
    (db, path)
}

#[test]
fn test_vault_pin_service() {
    let (db, path) = create_temp_db("vault-pin");

    // Initially no PIN
    assert!(!vault::has_vault_pin_db(&db).expect("Failed to check PIN existence"));

    // Setting an invalid PIN should fail (<4 digits or non-numeric or >12 digits)
    assert!(vault::set_vault_pin_db(&db, None, "123").is_err());
    assert!(vault::set_vault_pin_db(&db, None, "abcdef").is_err());
    assert!(vault::set_vault_pin_db(&db, None, "1234567890123").is_err());

    // Valid 4-digit PIN
    vault::set_vault_pin_db(&db, None, "1234").expect("Failed to set 4-digit PIN");
    assert!(vault::has_vault_pin_db(&db).expect("Failed to check PIN existence"));
    assert!(vault::verify_vault_pin_db(&db, "1234").expect("Verification failed"));
    assert!(!vault::verify_vault_pin_db(&db, "0000").expect("Wrong PIN should fail"));

    // Change to 8-digit PIN
    assert!(vault::set_vault_pin_db(&db, Some("wrong"), "87654321").is_err());
    vault::set_vault_pin_db(&db, Some("1234"), "87654321").expect("Failed to change PIN");
    assert!(vault::verify_vault_pin_db(&db, "87654321").expect("Verification failed"));

    // Cleanup
    std::fs::remove_file(path).ok();
}

#[test]
fn test_vault_privacy_filtering_and_trash() {
    let (db, path) = create_temp_db("vault-trash");
    let initial = db.get_initial_data().expect("Failed to load initial data");

    // Create a private subject
    let private_sub = SubjectItem {
        id: "subject-vault-test".to_string(),
        name: "Confidential Project".to_string(),
        color: "#ff0055".to_string(),
        icon: None,
        order: 999,
        is_private: true,
    };
    db.save_subject(&private_sub).expect("Failed to save private subject");

    // Add note in private subject
    let secret_note = NoteItem {
        id: "note-secret-vault".to_string(),
        folder_id: initial.folders[0].id.clone(),
        subject_id: private_sub.id.clone(),
        title: "Top Secret Strategy".to_string(),
        content: "TopSecretKeyword inside private vault note.".to_string(),
        is_completed: false,
        is_pinned: false,
        tags: vec!["Secret".to_string()],
        links: vec![],
        sketches: vec![],
        attachments: vec![],
        created_at: "2026-10-29T00:00:00Z".to_string(),
        updated_at: "2026-10-29T00:00:00Z".to_string(),
        due_date: None,
        focus_minutes: None,
        order: Some(0),
        is_private: false, // In private subject, note itself is also protected
    };
    db.save_note(&secret_note).expect("Failed to save secret note");

    // Search with include_private = false should NOT return secret_note
    let public_search = db.search_notes("TopSecretKeyword", false).expect("Search failed");
    assert!(
        !public_search.iter().any(|n| n.id == secret_note.id),
        "Private notes must not appear in search when vault is locked"
    );

    // Search with include_private = true SHOULD return secret_note
    let private_search = db.search_notes("TopSecretKeyword", true).expect("Search failed");
    assert!(
        private_search.iter().any(|n| n.id == secret_note.id),
        "Private notes should appear in search when vault is unlocked"
    );

    // Test Trash functionality: soft delete
    db.delete_note(&secret_note.id).expect("Failed to soft-delete note");

    // Note should not appear in active search
    let active_search = db.search_notes("TopSecretKeyword", true).expect("Search failed");
    assert!(!active_search.iter().any(|n| n.id == secret_note.id));

    // When vault is locked, get_deleted_notes must exclude private notes
    let locked_trash = db.get_deleted_notes(false).expect("Failed to get trash");
    assert!(!locked_trash.iter().any(|n| n.id == secret_note.id));

    // When vault is unlocked, get_deleted_notes must include private notes
    let unlocked_trash = db.get_deleted_notes(true).expect("Failed to get trash");
    assert!(unlocked_trash.iter().any(|n| n.id == secret_note.id));

    // Restore note
    db.restore_note(&secret_note.id).expect("Failed to restore note");
    let restored_search = db.search_notes("TopSecretKeyword", true).expect("Search failed");
    assert!(restored_search.iter().any(|n| n.id == secret_note.id));

    // Permanent delete
    db.permanently_delete_notes(&[secret_note.id.clone()]).expect("Failed to permanently delete");
    let final_trash = db.get_deleted_notes(true).expect("Failed to get trash");
    assert!(!final_trash.iter().any(|n| n.id == secret_note.id));

    // Cleanup
    std::fs::remove_file(path).ok();
}

#[test]
fn test_private_folder_and_note_in_public_subject() {
    let (db, path) = create_temp_db("private-folder-note");
    let initial = db.get_initial_data().expect("Failed to load initial data");
    let public_sub = &initial.subjects[0];

    // 1. Create a private folder in public subject
    let private_folder = udo_lib::models::FolderItem {
        id: "folder-private-1".to_string(),
        subject_id: public_sub.id.clone(),
        name: "Carpeta Privada".to_string(),
        is_expanded: true,
        order: 99,
        is_private: true,
    };
    db.save_folder(&private_folder).expect("Failed to save private folder");

    // 2. Create note in private folder
    let note_in_priv_folder = NoteItem {
        id: "note-in-priv-folder".to_string(),
        folder_id: private_folder.id.clone(),
        subject_id: public_sub.id.clone(),
        title: "Nota en carpeta privada".to_string(),
        content: "KeywordPrivFolder inside private folder.".to_string(),
        is_completed: false,
        is_pinned: false,
        tags: vec![],
        links: vec![],
        sketches: vec![],
        attachments: vec![],
        created_at: "2026-10-29T00:00:00Z".to_string(),
        updated_at: "2026-10-29T00:00:00Z".to_string(),
        due_date: None,
        focus_minutes: None,
        order: Some(0),
        is_private: false,
    };
    db.save_note(&note_in_priv_folder).expect("Failed to save note in private folder");

    // 3. Create a private note directly in a public folder
    let priv_note_in_pub_folder = NoteItem {
        id: "note-priv-in-pub-folder".to_string(),
        folder_id: initial.folders[0].id.clone(),
        subject_id: public_sub.id.clone(),
        title: "Nota privada en carpeta publica".to_string(),
        content: "KeywordPrivNote directly private.".to_string(),
        is_completed: false,
        is_pinned: false,
        tags: vec![],
        links: vec![],
        sketches: vec![],
        attachments: vec![],
        created_at: "2026-10-29T00:00:00Z".to_string(),
        updated_at: "2026-10-29T00:00:00Z".to_string(),
        due_date: None,
        focus_minutes: None,
        order: Some(1),
        is_private: true,
    };
    db.save_note(&priv_note_in_pub_folder).expect("Failed to save private note in public folder");

    // Search with include_private = false must exclude BOTH
    let search_locked = db.search_notes("KeywordPriv", false).expect("Search failed");
    assert!(!search_locked.iter().any(|n| n.id == note_in_priv_folder.id), "Note in private folder must be hidden");
    assert!(!search_locked.iter().any(|n| n.id == priv_note_in_pub_folder.id), "Private note must be hidden");

    // Search with include_private = true must find BOTH
    let search_unlocked = db.search_notes("KeywordPriv", true).expect("Search failed");
    assert!(search_unlocked.iter().any(|n| n.id == note_in_priv_folder.id), "Note in private folder should be found");
    assert!(search_unlocked.iter().any(|n| n.id == priv_note_in_pub_folder.id), "Private note should be found");

    // Cleanup
    std::fs::remove_file(path).ok();
}

#[test]
fn test_initial_seed_completed_no_reseed_when_empty() {
    let (db, path) = create_temp_db("no-reseed");
    let initial = db.get_initial_data().expect("Failed to load initial data");
    assert!(!initial.subjects.is_empty());

    // User deletes all subjects and notes
    for s in &initial.subjects {
        db.delete_subject(&s.id).expect("Failed to delete subject");
    }

    let empty_data = db.get_initial_data().expect("Failed to load initial data");
    assert_eq!(empty_data.subjects.len(), 0, "Subjects should be 0");
    assert_eq!(empty_data.notes.len(), 0, "Notes should be 0");

    // Simulate closing app and reopening: DatabaseManager::new_with_path runs init_schema again
    let reopened_db = DatabaseManager::new_with_path(path.clone()).expect("Failed to reopen DB");
    let reopened_data = reopened_db.get_initial_data().expect("Failed to load reopened data");

    assert_eq!(reopened_data.subjects.len(), 0, "Deleted subjects must NOT be reseeded on restart!");
    assert_eq!(reopened_data.notes.len(), 0, "Deleted notes must NOT be reseeded on restart!");

    std::fs::remove_file(path).ok();
}
