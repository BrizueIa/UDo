import { useState, useRef, useEffect, useCallback } from 'react';
import { NoteItem } from '../../../shared/types';

interface Props {
  note: NoteItem;
  onUpdateNote: (note: NoteItem) => void;
}

export function useNoteEditorState({ note, onUpdateNote }: Props) {
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

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
    debounceTimerRef.current = setTimeout(flushSave, 250);
  };

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
    flushSave,
  };
}
