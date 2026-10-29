import React, { useState } from 'react';
import { NoteItem, LinkItem, SketchItem, FolderItem } from '../../../shared/types';
import { NoteActionRibbon } from './NoteActionRibbon';
import { NoteAttachmentsDrawer } from './NoteAttachmentsDrawer';
import { MarkdownSheetPreview } from './MarkdownSheetPreview';
import { NoteMetadataBar } from './NoteMetadataBar';
import { NoteFindBar } from './NoteFindBar';
import { NoteMediaBar } from './NoteMediaBar';
import { NoteContentHeader } from './NoteContentHeader';
import { NoteTemplatePicker } from './NoteTemplatePicker';
import { Search } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { playTaskCompleteSound } from '../../../shared/utils/soundEffects';
import { useNoteMediaPaste } from '../hooks/useNoteMediaPaste';
import { useNoteEditorState } from '../hooks/useNoteEditorState';

interface Props {
  note: NoteItem;
  notes: NoteItem[];
  folderName: string;
  folders: FolderItem[];
  activeTagFilter?: string | null;
  activeTimerFormatted?: string;
  isTimerRunning?: boolean;
  onOpenFocusTimer?: () => void;
  onUpdateNote: (note: NoteItem) => void;
  onDeleteNote: (id: string) => void;
  onSelectNote: (noteId: string, subjectId: string) => void;
  onCreateNoteWithTitle: (title: string) => void;
  onSelectTagFilter: (tag: string) => void;
  onOpenSketchAnnotator: (sketch: SketchItem) => void;
  onOpenWhiteboard: () => void;
}

export const NoteDetailView: React.FC<Props> = ({
  note,
  notes,
  folderName,
  folders,
  activeTagFilter,
  activeTimerFormatted,
  isTimerRunning,
  onOpenFocusTimer,
  onUpdateNote,
  onDeleteNote,
  onSelectNote,
  onCreateNoteWithTitle,
  onSelectTagFilter,
  onOpenSketchAnnotator,
  onOpenWhiteboard,
}) => {
  const { t } = useTranslation();

  // Attachments inputs state
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [newLinkTitle, setNewLinkTitle] = useState('');
  const [newLinkUrl, setNewLinkUrl] = useState('');
  const [isMediaDrawerOpen, setIsMediaDrawerOpen] = useState(true);

  // Editor buffered state for 0ms typing response & find bar (FR-07)
  const {
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
  } = useNoteEditorState({ note, onUpdateNote });

  const handleToggleComplete = () => {
    const nextState = !note.isCompleted;
    if (nextState) playTaskCompleteSound();
    onUpdateNote({ ...note, isCompleted: nextState, updatedAt: new Date().toISOString() });
  };

  const handleTogglePin = () => {
    onUpdateNote({ ...note, isPinned: !note.isPinned, updatedAt: new Date().toISOString() });
  };

  const handleSelectFolder = (newFolderId: string) => {
    onUpdateNote({ ...note, folderId: newFolderId, updatedAt: new Date().toISOString() });
  };

  const handleInsertTask = () => {
    const taskPrefix = '- [ ] ';
    let newContent = '';

    if (viewMode === 'edit' && textareaRef.current) {
      const textarea = textareaRef.current;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const before = localContent.substring(0, start);
      const after = localContent.substring(end);
      const needsNewline = before.length > 0 && !before.endsWith('\n');
      newContent = `${before}${needsNewline ? '\n' : ''}${taskPrefix}${after}`;
    } else {
      const needsNewline = localContent.length > 0 && !localContent.endsWith('\n');
      newContent = `${localContent}${needsNewline ? '\n' : ''}${taskPrefix}${t('note.newTask')}`;
    }

    handleContentChange(newContent);
    onUpdateNote({ ...note, content: newContent, updatedAt: new Date().toISOString() });
  };

  const handleToggleCheckbox = (targetLineIdx: number) => {
    const lines = localContent.split('\n');
    const targetLine = lines[targetLineIdx];
    if (targetLine === undefined) return;

    const match = targetLine.match(/^(\s*[-*]\s+\[)( |x|X)(\])(.*)$/);
    if (match) {
      const isCurrentlyChecked = match[2].toLowerCase() === 'x';
      const newChar = isCurrentlyChecked ? ' ' : 'x';
      if (!isCurrentlyChecked) playTaskCompleteSound();
      lines[targetLineIdx] = `${match[1]}${newChar}${match[3]}${match[4]}`;
      const updatedText = lines.join('\n');
      handleContentChange(updatedText);
      onUpdateNote({ ...note, content: updatedText, updatedAt: new Date().toISOString() });
    }
  };

  const handleAddLink = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLinkTitle || !newLinkUrl) return;
    const newLink: LinkItem = {
      id: `link-${Date.now()}`,
      title: newLinkTitle,
      url: newLinkUrl.startsWith('http') ? newLinkUrl : `https://${newLinkUrl}`,
    };
    onUpdateNote({
      ...note,
      links: [...note.links, newLink],
      updatedAt: new Date().toISOString(),
    });
    setNewLinkTitle('');
    setNewLinkUrl('');
    setShowLinkInput(false);
  };

  const handleRemoveLink = (linkId: string) => {
    onUpdateNote({ ...note, links: note.links.filter((l) => l.id !== linkId), updatedAt: new Date().toISOString() });
  };

  const handleRemoveSketch = (sketchId: string) => {
    onUpdateNote({ ...note, sketches: note.sketches.filter((s) => s.id !== sketchId), updatedAt: new Date().toISOString() });
  };

  const handleAddTag = (tag: string) => {
    if (!note.tags.includes(tag)) {
      onUpdateNote({ ...note, tags: [...note.tags, tag], updatedAt: new Date().toISOString() });
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    onUpdateNote({ ...note, tags: note.tags.filter((t) => t !== tagToRemove), updatedAt: new Date().toISOString() });
  };

  const handleSelectTemplate = (templateContent: string, templateTitle?: string) => {
    const updatedTitle =
      (!localTitle.trim() || localTitle === t('note.titlePlaceholder')) && templateTitle
        ? templateTitle
        : localTitle;
    handleTitleChange({ target: { value: updatedTitle } } as React.ChangeEvent<HTMLInputElement>);
    handleContentChange(templateContent);
    onUpdateNote({
      ...note,
      title: updatedTitle,
      content: templateContent,
      updatedAt: new Date().toISOString(),
    });
  };

  const { handleDragOver, handleDrop } = useNoteMediaPaste({
    note,
    onUpdateNote,
    onOpenMediaDrawer: () => setIsMediaDrawerOpen(true),
  });

  const totalMediaCount = note.links.length + note.sketches.length;

  return (
    <div
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      className="flex-1 bg-theme-base flex flex-col h-full overflow-y-auto"
    >
      {/* Top Action Ribbon */}
      <NoteActionRibbon
        note={note}
        folderName={folderName}
        folders={folders}
        activeTimerFormatted={activeTimerFormatted}
        isTimerRunning={isTimerRunning}
        onToggleComplete={handleToggleComplete}
        onTogglePin={handleTogglePin}
        onSelectFolder={handleSelectFolder}
        onDeleteNote={onDeleteNote}
        onOpenFocusTimer={onOpenFocusTimer}
      />

      {/* Main Content Area */}
      <div className="max-w-4xl w-full mx-auto px-10 py-6 space-y-5">
        {/* Title & Find Bar Header */}
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-4">
            <input
              type="text"
              value={localTitle}
              onChange={handleTitleChange}
              onBlur={flushSave}
              placeholder={t('note.titlePlaceholder')}
              className={`w-full text-3xl font-bold bg-transparent outline-none border-b border-transparent focus:border-theme-accent/50 pb-1 transition-colors ${
                note.isCompleted ? 'line-through text-theme-muted opacity-80' : 'text-theme-text'
              }`}
            />
            {/* Find in Note Trigger & Toolbar (FR-07) */}
            <div className="flex-shrink-0 flex items-center space-x-2">
              <NoteFindBar
                isOpen={isFindBarOpen}
                findQuery={findQuery}
                matchIndex={currentMatchIndex}
                totalMatches={totalMatches}
                onChangeQuery={(q) => {
                  setFindQuery(q);
                  setCurrentMatchIndex(0);
                }}
                onNextMatch={() => {
                  if (totalMatches > 0) {
                    setCurrentMatchIndex((prev) => (prev + 1) % totalMatches);
                  }
                }}
                onPrevMatch={() => {
                  if (totalMatches > 0) {
                    setCurrentMatchIndex((prev) => (prev - 1 + totalMatches) % totalMatches);
                  }
                }}
                onClose={() => {
                  setIsFindBarOpen(false);
                  setFindQuery('');
                  setCurrentMatchIndex(0);
                }}
              />
              {!isFindBarOpen && (
                <button
                  type="button"
                  onClick={() => setIsFindBarOpen(true)}
                  className="p-1.5 rounded-lg text-theme-muted hover:text-theme-text hover:bg-theme-card border border-white/[0.05] transition-colors"
                  title={t('note.findInNote')}
                >
                  <Search size={15} />
                </button>
              )}
            </div>
          </div>

          {/* Modular Metadata Row (FR-21) */}
          <NoteMetadataBar
            updatedAt={note.updatedAt}
            tags={note.tags}
            focusMinutes={note.focusMinutes}
            activeTagFilter={activeTagFilter}
            onSelectTagFilter={onSelectTagFilter}
            onRemoveTag={handleRemoveTag}
            onAddTag={handleAddTag}
          />
        </div>

        {/* Media & Attachments Bar */}
        <NoteMediaBar
          isMediaDrawerOpen={isMediaDrawerOpen}
          totalMediaCount={totalMediaCount}
          onToggleMediaDrawer={() => setIsMediaDrawerOpen(!isMediaDrawerOpen)}
          onToggleAddLink={() => setShowLinkInput(!showLinkInput)}
          onOpenWhiteboard={onOpenWhiteboard}
        />

        {/* Attachments Drawer */}
        <NoteAttachmentsDrawer
          isOpen={isMediaDrawerOpen}
          links={note.links}
          sketches={note.sketches}
          showLinkInput={showLinkInput}
          newLinkTitle={newLinkTitle}
          newLinkUrl={newLinkUrl}
          onSetNewLinkTitle={setNewLinkTitle}
          onSetNewLinkUrl={setNewLinkUrl}
          onAddLink={handleAddLink}
          onCloseLinkInput={() => setShowLinkInput(false)}
          onRemoveLink={handleRemoveLink}
          onRemoveSketch={handleRemoveSketch}
          onOpenSketchAnnotator={onOpenSketchAnnotator}
        />

        {/* Sheet Content Section */}
        <div className="space-y-4 pt-2">
          {/* Section Header with Mode Switches */}
          <NoteContentHeader
            viewMode={viewMode}
            onSetViewMode={(mode) => {
              setViewMode(mode);
              if (mode === 'edit') {
                setTimeout(() => textareaRef.current?.focus(), 50);
              }
            }}
            onInsertTask={handleInsertTask}
            onSelectTemplate={handleSelectTemplate}
          />

          {/* Quick Starter Templates when note content is empty (FR-23) */}
          {!localContent.trim() && (
            <NoteTemplatePicker onSelectTemplate={handleSelectTemplate} />
          )}

          {/* Markdown Sheet Preview with Wiki-Links & Match Highlighting (FR-07, FR-22) */}
          <MarkdownSheetPreview
            content={localContent}
            notes={notes}
            viewMode={viewMode}
            textareaRef={textareaRef}
            findQuery={findQuery}
            currentMatchIndex={currentMatchIndex}
            onChangeContent={handleContentChange}
            onToggleCheckbox={handleToggleCheckbox}
            onSelectNote={onSelectNote}
            onCreateNoteWithTitle={onCreateNoteWithTitle}
            onMatchCountCalculated={setTotalMatches}
          />
        </div>
      </div>
    </div>
  );
};
