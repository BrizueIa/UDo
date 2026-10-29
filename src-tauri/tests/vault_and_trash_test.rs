use udo_lib::db::DatabaseManager;
use udo_lib::models::{NoteItem, SubjectItem};
use udo_lib::services::vault;

#[test]
fn test_vault_pin_service() {
    let db = DatabaseManager::new().expect("Failed to initialize DatabaseManager");

    // Setting an invalid PIN should fail
    assert!(vault::set_vault_pin_db(&db, None, "123").is_err());
    assert!(vault::set_vault_pin_db(&db, None, "abcdef").is_err());
    assert!(vault::set_vault_pin_db(&db, None, "1234567").is_err());

    // Valid 6-digit PIN
    vault::set_vault_pin_db(&db, None, "654321").expect("Failed to set 6-digit PIN");
    assert!(vault::has_vault_pin_db(&db).expect("Failed to check PIN existence"));

    // Verify PIN
    assert!(vault::verify_vault_pin_db(&db, "654321").expect("Verification failed"));
    assert!(!vault::verify_vault_pin_db(&db, "000000").expect("Verification should fail for wrong PIN"));
}

#[test]
fn test_vault_privacy_filtering_and_trash() {
    let db = DatabaseManager::new().expect("Failed to initialize DatabaseManager");
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
}
