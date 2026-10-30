import { useState, useRef, useEffect, useCallback } from 'react';
import { NoteItem, SketchItem, NoteAttachment } from '../../../shared/types';

export interface NoteEditorSnapshot {
  title: string;
  content: string;
  sketches: SketchItem[];
  attachments: NoteAttachment[];
}

interface Props {
  note: NoteItem;
  onUpdateNote: (note: NoteItem) => void;
  onWorkspaceUndo?: () => void;
  onWorkspaceRedo?: () => void;
}

function isSnapshotEqual(a: NoteEditorSnapshot | null, b: NoteEditorSnapshot | null): boolean {
  if (!a || !b) return false;
  if (a.title !== b.title || a.content !== b.content) return false;
  if ((a.sketches?.length || 0) !== (b.sketches?.length || 0)) return false;
  if ((a.attachments?.length || 0) !== (b.attachments?.length || 0)) return false;
  if (JSON.stringify(a.sketches) !== JSON.stringify(b.sketches)) return false;
  if (JSON.stringify(a.attachments) !== JSON.stringify(b.attachments)) return false;
  return true;
}

export function useNoteEditorState({
  note,
  onUpdateNote,
  onWorkspaceUndo,
  onWorkspaceRedo,
}: Props) {
  // View Mode: 'preview' (Interactive checkboxes/markdown) vs 'edit' (Markdown source)
  const [viewMode, setViewMode] = useState<'preview' | 'edit'>('preview');

  // Find Bar State (FR-07)
  const [isFindBarOpen, setIsFindBarOpen] = useState(false);
  const [findQuery, setFindQuery] = useState('');
  const [currentMatchIndex, setCurrentMatchIndex] = useState(0);
  const [totalMatches, setTotalMatches] = useState(0);

  // Local state for 0ms typing response without IPC/SQLite bottlenecks
  const [localTitle, setLocalTitle] = useState(note.title);
  const [localContent, setLocalContent] = useState(note.content);
  const noteRef = useRef(note);
  noteRef.current = note;

  // Internal complete snapshot undo/redo history stack (Text, Sketches, Attachments, Layers)
  const undoStackRef = useRef<NoteEditorSnapshot[]>([]);
  const redoStackRef = useRef<NoteEditorSnapshot[]>([]);
  const lastPushedSnapshotRef = useRef<NoteEditorSnapshot | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingUpdatesRef = useRef<{ title: string; content: string }>({
    title: note.title,
    content: note.content,
  });

  const getSnapshotFromNote = useCallback((n: NoteItem, title = n.title, content = n.content): NoteEditorSnapshot => ({
    title,
    content,
    sketches: n.sketches ? [...n.sketches] : [],
    attachments: n.attachments ? [...n.attachments] : [],
  }), []);

  // Synchronize local state when active note changes
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }
    setLocalTitle(note.title);
    setLocalContent(note.content);
    pendingUpdatesRef.current = { title: note.title, content: note.content };
    const initialSnap = getSnapshotFromNote(note);
    undoStackRef.current = [initialSnap];
    redoStackRef.current = [];
    lastPushedSnapshotRef.current = initialSnap;
  }, [note.id, getSnapshotFromNote]);

  // Push snapshot helper
  const pushSnapshot = useCallback((override?: Partial<NoteEditorSnapshot>) => {
    const cur = noteRef.current;
    const snap: NoteEditorSnapshot = {
      title: override?.title !== undefined ? override.title : pendingUpdatesRef.current.title,
      content: override?.content !== undefined ? override.content : pendingUpdatesRef.current.content,
      sketches: override?.sketches !== undefined ? override.sketches : (cur.sketches ? [...cur.sketches] : []),
      attachments: override?.attachments !== undefined ? override.attachments : (cur.attachments ? [...cur.attachments] : []),
    };
    if (isSnapshotEqual(lastPushedSnapshotRef.current, snap)) return;
    undoStackRef.current.push(snap);
    if (undoStackRef.current.length > 50) undoStackRef.current.shift();
    lastPushedSnapshotRef.current = snap;
    redoStackRef.current = [];
  }, []);

  // Synchronize external changes
  useEffect(() => {
    if (note.title !== pendingUpdatesRef.current.title) {
      setLocalTitle(note.title);
      pendingUpdatesRef.current.title = note.title;
    }
    if (note.content !== pendingUpdatesRef.current.content) {
      setLocalContent(note.content);
      pendingUpdatesRef.current.content = note.content;
    }
    const currentSnap = getSnapshotFromNote(note);
    if (!isSnapshotEqual(lastPushedSnapshotRef.current, currentSnap)) {
      undoStackRef.current.push(currentSnap);
      if (undoStackRef.current.length > 50) undoStackRef.current.shift();
      lastPushedSnapshotRef.current = currentSnap;
      redoStackRef.current = [];
    }
  }, [note.title, note.content, note.sketches, note.attachments, getSnapshotFromNote]);

  const flushSave = useCallback(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }
    const currentNote = noteRef.current;
    if (
      pendingUpdatesRef.current.title !== currentNote.title ||
      pendingUpdatesRef.current.content !== currentNote.content
    ) {
      onUpdateNote({
        ...currentNote,
        title: pendingUpdatesRef.current.title,
        content: pendingUpdatesRef.current.content,
        updatedAt: new Date().toISOString(),
      });
    }
  }, [onUpdateNote]);

  const flushSaveRef = useRef(flushSave);
  flushSaveRef.current = flushSave;

  // Flush only on true unmount of the note editor
  useEffect(() => {
    return () => {
      flushSaveRef.current();
    };
  }, []);

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement> | { target: { value: string } }) => {
    const val = e.target.value;
    setLocalTitle(val);
    pendingUpdatesRef.current.title = val;
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = setTimeout(() => {
      flushSave();
      pushSnapshot({ title: val });
    }, 250);
  };

  const handleContentChange = (newContent: string) => {
    setLocalContent(newContent);
    pendingUpdatesRef.current.content = newContent;
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = setTimeout(() => {
      flushSave();
      pushSnapshot({ content: newContent });
    }, 250);
  };

  const handleUndoNote = useCallback((): boolean => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }

    const curSnap: NoteEditorSnapshot = {
      title: pendingUpdatesRef.current.title,
      content: pendingUpdatesRef.current.content,
      sketches: noteRef.current.sketches ? [...noteRef.current.sketches] : [],
      attachments: noteRef.current.attachments ? [...noteRef.current.attachments] : [],
    };
    if (!isSnapshotEqual(lastPushedSnapshotRef.current, curSnap)) {
      undoStackRef.current.push(curSnap);
      lastPushedSnapshotRef.current = curSnap;
    }

    if (undoStackRef.current.length > 1) {
      const popped = undoStackRef.current.pop()!;
      redoStackRef.current.push(popped);
      const previous = undoStackRef.current[undoStackRef.current.length - 1];

      setLocalTitle(previous.title);
      setLocalContent(previous.content);
      pendingUpdatesRef.current = { title: previous.title, content: previous.content };
      lastPushedSnapshotRef.current = previous;

      const restoredNote: NoteItem = {
        ...noteRef.current,
        title: previous.title,
        content: previous.content,
        sketches: previous.sketches,
        attachments: previous.attachments,
        updatedAt: new Date().toISOString(),
      };
      noteRef.current = restoredNote;
      onUpdateNote(restoredNote);
      return true;
    }

    onWorkspaceUndo?.();
    return false;
  }, [onUpdateNote, onWorkspaceUndo]);

  const handleRedoNote = useCallback((): boolean => {
    if (redoStackRef.current.length > 0) {
      const next = redoStackRef.current.pop()!;
      undoStackRef.current.push(next);
      lastPushedSnapshotRef.current = next;

      setLocalTitle(next.title);
      setLocalContent(next.content);
      pendingUpdatesRef.current = { title: next.title, content: next.content };

      const restoredNote: NoteItem = {
        ...noteRef.current,
        title: next.title,
        content: next.content,
        sketches: next.sketches,
        attachments: next.attachments,
        updatedAt: new Date().toISOString(),
      };
      noteRef.current = restoredNote;
      onUpdateNote(restoredNote);
      return true;
    }

    onWorkspaceRedo?.();
    return false;
  }, [onUpdateNote, onWorkspaceRedo]);

  // Global custom event listeners for column 3 undo / redo
  useEffect(() => {
    const onCustomUndo = (e: Event) => {
      if (handleUndoNote()) e.preventDefault();
    };
    const onCustomRedo = (e: Event) => {
      if (handleRedoNote()) e.preventDefault();
    };
    window.addEventListener('udo-note-undo', onCustomUndo);
    window.addEventListener('udo-note-redo', onCustomRedo);
    return () => {
      window.removeEventListener('udo-note-undo', onCustomUndo);
      window.removeEventListener('udo-note-redo', onCustomRedo);
    };
  }, [handleUndoNote, handleRedoNote]);

  // Listen for Ctrl+F (Find in note) and Ctrl+E (Markdown edit mode)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && !e.shiftKey && e.key.toLowerCase() === 'f') {
        e.preventDefault();
        setIsFindBarOpen(true);
      } else if (e.ctrlKey && !e.shiftKey && e.key.toLowerCase() === 'e') {
        e.preventDefault();
        setViewMode('edit');
        setTimeout(() => textareaRef.current?.focus(), 50);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return {
    viewMode,
    setViewMode,
    localTitle,
    localContent,
    textareaRef,
    isFindBarOpen,
    setIsFindBarOpen,
    findQuery,
    setFindQuery,
    currentMatchIndex,
    setCurrentMatchIndex,
    totalMatches,
    setTotalMatches,
    handleTitleChange,
    handleContentChange,
    handleUndoNote,
    handleRedoNote,
    handleUndoText: handleUndoNote,
    handleRedoText: handleRedoNote,
    pushSnapshot,
    flushSave,
  };
}