import { useState, useRef, useEffect, useCallback } from 'react';
import { NoteItem } from '../../../shared/types';

interface Props {
  note: NoteItem;
  onUpdateNote: (note: NoteItem) => void;
  onWorkspaceUndo?: () => void;
  onWorkspaceRedo?: () => void;
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

  // Internal text undo/redo history stack
  const textUndoStackRef = useRef<string[]>([note.content]);
  const textRedoStackRef = useRef<string[]>([]);
  const lastPushedTextRef = useRef<string>(note.content);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingUpdatesRef = useRef<{ title: string; content: string }>({
    title: note.title,
    content: note.content,
  });

  // Synchronize local state when active note changes
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }
    setLocalTitle(note.title);
    setLocalContent(note.content);
    pendingUpdatesRef.current = { title: note.title, content: note.content };
    textUndoStackRef.current = [note.content];
    textRedoStackRef.current = [];
    lastPushedTextRef.current = note.content;
  }, [note.id]);

  // Synchronize when external actions change title or content (e.g. template, checkboxes)
  useEffect(() => {
    if (note.title !== pendingUpdatesRef.current.title) {
      setLocalTitle(note.title);
      pendingUpdatesRef.current.title = note.title;
    }
    if (note.content !== pendingUpdatesRef.current.content) {
      setLocalContent(note.content);
      pendingUpdatesRef.current.content = note.content;
      if (note.content !== lastPushedTextRef.current) {
        textUndoStackRef.current.push(note.content);
        if (textUndoStackRef.current.length > 50) textUndoStackRef.current.shift();
        lastPushedTextRef.current = note.content;
      }
    }
  }, [note.title, note.content]);

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

  // Flush on unmount
  useEffect(() => {
    return () => flushSave();
  }, [flushSave]);

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement> | { target: { value: string } }) => {
    const val = e.target.value;
    setLocalTitle(val);
    pendingUpdatesRef.current.title = val;
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = setTimeout(flushSave, 250);
  };

  const handleContentChange = (newContent: string) => {
    setLocalContent(newContent);
    pendingUpdatesRef.current.content = newContent;
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = setTimeout(() => {
      flushSave();
      if (newContent !== lastPushedTextRef.current) {
        textUndoStackRef.current.push(newContent);
        if (textUndoStackRef.current.length > 50) textUndoStackRef.current.shift();
        lastPushedTextRef.current = newContent;
        textRedoStackRef.current = [];
      }
    }, 250);
  };

  const handleUndoText = useCallback(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }

    const cur = pendingUpdatesRef.current.content;
    if (cur !== lastPushedTextRef.current) {
      textUndoStackRef.current.push(cur);
      lastPushedTextRef.current = cur;
    }

    if (textUndoStackRef.current.length > 1) {
      const current = textUndoStackRef.current.pop()!;
      textRedoStackRef.current.push(current);
      const previous = textUndoStackRef.current[textUndoStackRef.current.length - 1];
      setLocalContent(previous);
      pendingUpdatesRef.current.content = previous;
      lastPushedTextRef.current = previous;
      flushSave();
      return true;
    }

    // No local text history remaining, delegate to global workspace undo
    onWorkspaceUndo?.();
    return false;
  }, [flushSave, onWorkspaceUndo]);

  const handleRedoText = useCallback(() => {
    if (textRedoStackRef.current.length > 0) {
      const next = textRedoStackRef.current.pop()!;
      textUndoStackRef.current.push(next);
      lastPushedTextRef.current = next;
      setLocalContent(next);
      pendingUpdatesRef.current.content = next;
      flushSave();
      return true;
    }

    // No local text history remaining, delegate to global workspace redo
    onWorkspaceRedo?.();
    return false;
  }, [flushSave, onWorkspaceRedo]);

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
    handleUndoText,
    handleRedoText,
    flushSave,
  };
}
