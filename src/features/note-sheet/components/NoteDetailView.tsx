import React, { useState } from 'react';
import { NoteItem, SketchItem, FolderItem } from '../../../shared/types';
import { NoteActionRibbon } from './NoteActionRibbon';
import { NoteAttachmentsDrawer } from './NoteAttachmentsDrawer';
import { MarkdownSheetPreview } from './MarkdownSheetPreview';
import { NoteMetadataBar } from './NoteMetadataBar';
import { NoteTitleBar } from './NoteTitleBar';
import { NoteMediaBar } from './NoteMediaBar';
import { NoteContentHeader } from './NoteContentHeader';
import { NoteTemplatePicker } from './NoteTemplatePicker';
import { AttachmentModal } from './AttachmentModal';
import { AudioDeviceSettingsModal } from './AudioDeviceSettingsModal';
import { AlertTriangle, X, Lightbulb } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { playTaskCompleteSound } from '../../../shared/utils/soundEffects';
import { useNoteMediaPaste } from '../hooks/useNoteMediaPaste';
import { useNoteEditorState } from '../hooks/useNoteEditorState';
import { useNoteTaskActions } from '../hooks/useNoteTaskActions';
import { useNoteAttachments } from '../hooks/useNoteAttachments';
import { useNoteLinkActions } from '../hooks/useNoteLinkActions';

interface Props {
  note: NoteItem;
  notes: NoteItem[];
  folderName: string;
  folders: FolderItem[];
  subjectName?: string;
  subjectColor?: string;
  onRevealLocation?: () => void;
  showBreadcrumbs?: boolean;
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
  onWorkspaceUndo?: () => void;
  onWorkspaceRedo?: () => void;
}

export const NoteDetailView: React.FC<Props> = ({
  note,
  notes,
  folderName,
  folders,
  subjectName,
  subjectColor,
  onRevealLocation,
  showBreadcrumbs,
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
  onWorkspaceUndo,
  onWorkspaceRedo,
}) => {
  const { t } = useTranslation();

  // Attachments inputs & drawer state
  const [isMediaDrawerOpen, setIsMediaDrawerOpen] = useState(true);
  const [isAttachmentModalOpen, setIsAttachmentModalOpen] = useState(false);
  const [isAudioSettingsOpen, setIsAudioSettingsOpen] = useState(false);
  const [isStarterDismissed, setIsStarterDismissed] = useState(
    () => localStorage.getItem('udo_hide_starter_templates') === 'true'
  );

  // Link actions hook
  const {
    showLinkInput,
    setShowLinkInput,
    newLinkTitle,
    setNewLinkTitle,
    newLinkUrl,
    setNewLinkUrl,
    handleAddLink,
    handleRemoveLink,
  } = useNoteLinkActions({ note, onUpdateNote });

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
    handleUndoText,
    handleRedoText,
    flushSave,
  } = useNoteEditorState({ note, onUpdateNote, onWorkspaceUndo, onWorkspaceRedo });

  // Task & Checkbox Actions hook
  const { handleInsertTask, handleToggleCheckbox } = useNoteTaskActions({
    note,
    localContent,
    viewMode,
    textareaRef,
    onContentChange: handleContentChange,
    onUpdateNote,
  });

  // Universal Attachments & Voice Notes Hook (Sprint 5)
  const {
    blockedFileError,
    setBlockedFileError,
    handleAttachFiles,
    handleAddAttachment,
    handleRemoveAttachment,
  } = useNoteAttachments({
    note,
    onUpdateNote,
  });

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

  const handleRemoveSketch = (sketchId: string) => {
    onUpdateNote({
      ...note,
      sketches: note.sketches.filter((s) => s.id !== sketchId),
      updatedAt: new Date().toISOString(),
    });
  };

  const handleAddTag = (tag: string) => {
    if (!note.tags.includes(tag)) {
      onUpdateNote({ ...note, tags: [...note.tags, tag], updatedAt: new Date().toISOString() });
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    onUpdateNote({
      ...note,
      tags: note.tags.filter((t) => t !== tagToRemove),
      updatedAt: new Date().toISOString(),
    });
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

  const { handleDragOver, handleDrop, attachSketches, attachSingleSketch } = useNoteMediaPaste({
    note,
    onUpdateNote,
    onOpenMediaDrawer: () => setIsMediaDrawerOpen(true),
    onDropFiles: handleAttachFiles,
  });

  const attachmentsList = note.attachments || [];
  const totalMediaCount = note.links.length + note.sketches.length + attachmentsList.length;

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

      {/* Blocked File Security Warning Toast */}
      {blockedFileError && (
        <div className="mx-4 sm:mx-6 lg:mx-10 mt-3 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center justify-between shadow-sm">
          <div className="flex items-center space-x-2 min-w-0">
            <AlertTriangle size={15} className="shrink-0 text-red-400" />
            <span className="truncate">{blockedFileError}</span>
          </div>
          <div className="flex items-center space-x-2 shrink-0 ml-2">
            {(blockedFileError.includes('mic') || blockedFileError.includes('Mic') || blockedFileError.includes('permis')) && (
              <button
                type="button"
                onClick={() => setIsAudioSettingsOpen(true)}
                className="px-2 py-0.5 rounded bg-red-500/20 hover:bg-red-500/30 text-red-200 text-[11px] font-medium transition-colors cursor-pointer"
              >
                {t('audioSettings.configure')}
              </button>
            )}
            <button
              type="button"
              onClick={() => setBlockedFileError(null)}
              className="p-1 hover:bg-red-500/20 rounded transition-colors cursor-pointer text-red-300"
            >
              <X size={13} />
            </button>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-10 py-6 space-y-5">
        {/* Title & Find Bar Header */}
        <div className="space-y-3">
          <NoteTitleBar
            localTitle={localTitle}
            isCompleted={note.isCompleted}
            subjectName={subjectName}
            subjectColor={subjectColor}
            folderName={folderName}
            onRevealLocation={onRevealLocation}
            showBreadcrumbs={showBreadcrumbs}
            onTitleChange={handleTitleChange}
            onBlur={flushSave}
            isFindBarOpen={isFindBarOpen}
            findQuery={findQuery}
            currentMatchIndex={currentMatchIndex}
            totalMatches={totalMatches}
            onSetIsFindBarOpen={setIsFindBarOpen}
            onSetFindQuery={setFindQuery}
            onSetCurrentMatchIndex={setCurrentMatchIndex}
          />

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
          onOpenAttachModal={() => setIsAttachmentModalOpen(true)}
          onAttachmentCreated={handleAddAttachment}
          onError={(msg) => setBlockedFileError(msg)}
        />

        {/* Attachments Drawer */}
        <NoteAttachmentsDrawer
          isOpen={isMediaDrawerOpen}
          links={note.links}
          sketches={note.sketches}
          attachments={attachmentsList}
          showLinkInput={showLinkInput}
          newLinkTitle={newLinkTitle}
          newLinkUrl={newLinkUrl}
          onSetNewLinkTitle={setNewLinkTitle}
          onSetNewLinkUrl={setNewLinkUrl}
          onAddLink={handleAddLink}
          onCloseLinkInput={() => setShowLinkInput(false)}
          onRemoveLink={handleRemoveLink}
          onRemoveSketch={handleRemoveSketch}
          onRemoveAttachment={handleRemoveAttachment}
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
            onOpenAttachModal={() => setIsAttachmentModalOpen(true)}
          />

          {/* Quick Starter Templates when note content is empty (FR-23) */}
          {!localContent.trim() && !isStarterDismissed && (
            <NoteTemplatePicker
              onSelectTemplate={handleSelectTemplate}
              onDismiss={() => {
                setIsStarterDismissed(true);
                localStorage.setItem('udo_hide_starter_templates', 'true');
              }}
            />
          )}

          {!localContent.trim() && isStarterDismissed && (
            <div className="flex justify-end pt-1">
              <button
                type="button"
                onClick={() => {
                  setIsStarterDismissed(false);
                  localStorage.removeItem('udo_hide_starter_templates');
                }}
                className="text-[11px] text-theme-muted hover:text-theme-accent transition-colors flex items-center space-x-1.5 py-0.5 cursor-pointer"
                title={t('templates.showStarterPrompt')}
              >
                <Lightbulb size={12} className="text-amber-400" />
                <span>{t('templates.showStarterPrompt')}</span>
              </button>
            </div>
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
            onUndoText={handleUndoText}
            onRedoText={handleRedoText}
            onAttachSketches={attachSketches}
          />
        </div>
      </div>

      {/* Universal Attachment Modal */}
      <AttachmentModal
        isOpen={isAttachmentModalOpen}
        onClose={() => setIsAttachmentModalOpen(false)}
        onAttachSketch={attachSingleSketch}
        onAttachmentCreated={handleAddAttachment}
        onAttachFiles={handleAttachFiles}
      />

      {/* Audio Input/Output Device Settings Modal */}
      <AudioDeviceSettingsModal
        isOpen={isAudioSettingsOpen}
        onClose={() => setIsAudioSettingsOpen(false)}
      />
    </div>
  );
};
