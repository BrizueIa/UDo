import React, { useState, useRef, useCallback } from 'react';
import { NoteItem, SketchItem, FolderItem } from '../../../shared/types';
import { NoteActionRibbon } from './NoteActionRibbon';
import { UniversalFlatSheet } from './UniversalFlatSheet';
import { NoteMetadataBar } from './NoteMetadataBar';
import { NoteTitleBar } from './NoteTitleBar';
import { NoteUnifiedToolbar } from './NoteUnifiedToolbar';
import { NoteTemplatePicker } from './NoteTemplatePicker';
import { AttachmentModal } from './AttachmentModal';
import { AudioDeviceSettingsModal } from './AudioDeviceSettingsModal';
import { AlertTriangle, X, Lightbulb } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { playTaskCompleteSound } from '../../../shared/utils/soundEffects';
import { useNoteMediaPaste } from '../hooks/useNoteMediaPaste';
import { useNoteEditorState } from '../hooks/useNoteEditorState';
import { useNoteAttachments } from '../hooks/useNoteAttachments';
import { useNoteLinkActions } from '../hooks/useNoteLinkActions';

interface Props {
  note: NoteItem; notes: NoteItem[]; folderName: string; folders: FolderItem[];
  subjectName?: string; subjectColor?: string; onRevealLocation?: () => void;
  showBreadcrumbs?: boolean; activeTagFilter?: string | null;
  activeTimerFormatted?: string; isTimerRunning?: boolean; isSplitView?: boolean;
  onToggleSplitView?: () => void; onCloseSplitPane?: () => void;
  onOpenFocusTimer?: () => void; onUpdateNote: (note: NoteItem) => void;
  onDeleteNote: (id: string) => void;
  onSelectNote: (noteId: string, subjectId: string) => void;
  onCreateNoteWithTitle: (title: string) => void;
  onSelectTagFilter: (tag: string) => void;
  onOpenSketchAnnotator: (sketch: SketchItem) => void;
  onOpenWhiteboard: () => void;
  onWorkspaceUndo?: () => void; onWorkspaceRedo?: () => void;
}

export const NoteDetailView: React.FC<Props> = ({
  note, notes, folderName, folders, subjectName, subjectColor,
  onRevealLocation, showBreadcrumbs, activeTagFilter, activeTimerFormatted,
  isTimerRunning, isSplitView, onToggleSplitView, onCloseSplitPane,
  onOpenFocusTimer, onUpdateNote, onDeleteNote, onSelectNote,
  onCreateNoteWithTitle, onSelectTagFilter, onOpenSketchAnnotator,
  onOpenWhiteboard, onWorkspaceUndo, onWorkspaceRedo,
}) => {
  const { t } = useTranslation();
  const [isAttachmentModalOpen, setIsAttachmentModalOpen] = useState(false);
  const [isAudioSettingsOpen, setIsAudioSettingsOpen] = useState(false);
  const [isStarterDismissed, setIsStarterDismissed] = useState(
    () => localStorage.getItem('udo_hide_starter_templates') === 'true'
  );
  const activeCursorLineRef = useRef<number>(0);

  const {
    localTitle, localContent, isFindBarOpen, setIsFindBarOpen,
    findQuery, setFindQuery, currentMatchIndex, setCurrentMatchIndex,
    totalMatches, setTotalMatches, handleTitleChange, handleContentChange,
    handleUndoText, handleRedoText, flushSave,
  } = useNoteEditorState({ note, onUpdateNote, onWorkspaceUndo, onWorkspaceRedo });

  const insertTokenAtCursor = useCallback(
    (tokenBlock: string, explicitLineIdx?: number): string => {
      const lines = (localContent || '').split('\n');
      const idx = Math.max(0, Math.min(explicitLineIdx ?? activeCursorLineRef.current, lines.length - 1));
      const tokenLines = tokenBlock.split('\n');
      if (lines.length === 1 && !lines[0].trim()) {
        const next = [...tokenLines, ''].join('\n');
        handleContentChange(next);
        activeCursorLineRef.current = tokenLines.length;
        return next;
      }
      lines.splice(idx + 1, 0, ...tokenLines, '');
      const next = lines.join('\n');
      handleContentChange(next);
      activeCursorLineRef.current = idx + tokenLines.length + 1;
      return next;
    },
    [localContent, handleContentChange]
  );

  const {
    showLinkInput, setShowLinkInput, newLinkTitle, setNewLinkTitle,
    newLinkUrl, setNewLinkUrl, handleAddLink, handleRemoveLink,
  } = useNoteLinkActions({
    note, onUpdateNote, onInsertEmbedToken: (token) => insertTokenAtCursor(token),
  });

  const {
    blockedFileError, setBlockedFileError, handleAttachFiles,
    handleAddAttachment, handleRemoveAttachment, handleUpdateAttachment,
  } = useNoteAttachments({
    note, onUpdateNote, onInsertEmbedToken: (token) => insertTokenAtCursor(token),
  });

  const { handleDragOver, handleDrop, attachSingleSketch } = useNoteMediaPaste({
    note,
    onUpdateNote,
    onOpenMediaDrawer: () => {},
    onDropFiles: handleAttachFiles,
    onInsertEmbedToken: (token) => insertTokenAtCursor(token),
  });

  const handleAttachSketchesAtLine = useCallback(
    (newSketches: SketchItem[], lineIdx: number) => {
      if (newSketches.length === 0) return;
      const tokens = newSketches.map((s) => `[embed:sketch:${s.id}]`).join('\n');
      const nextContent = insertTokenAtCursor(tokens, lineIdx);
      onUpdateNote({
        ...note,
        content: nextContent,
        sketches: [...note.sketches, ...newSketches],
        updatedAt: new Date().toISOString(),
      });
    },
    [insertTokenAtCursor, note, onUpdateNote]
  );

  const handleInsertTaskAtCursor = useCallback(() => {
    const lines = (localContent || '').split('\n');
    const idx = Math.max(0, Math.min(activeCursorLineRef.current, lines.length - 1));
    const current = lines[idx] || '';
    if (!current.trim()) {
      lines[idx] = '- [ ] ';
    } else if (!/^\s*[-*]\s+\[[ xX]\]/.test(current)) {
      lines[idx] = `- [ ] ${current}`;
    } else {
      lines.splice(idx + 1, 0, '- [ ] ');
      activeCursorLineRef.current = idx + 1;
    }
    const next = lines.join('\n');
    handleContentChange(next);
    onUpdateNote({ ...note, content: next, updatedAt: new Date().toISOString() });
  }, [localContent, handleContentChange, note, onUpdateNote]);

  const handleRemoveSketch = (sketchId: string) => {
    const nextContent = (localContent || '').split('\n').filter((l) => l.trim() !== `[embed:sketch:${sketchId}]`).join('\n');
    handleContentChange(nextContent);
    onUpdateNote({
      ...note, content: nextContent,
      sketches: note.sketches.filter((s) => s.id !== sketchId),
      updatedAt: new Date().toISOString(),
    });
  };

  const handleResizeSketch = (sketchId: string, width: number) => {
    onUpdateNote({
      ...note, sketches: note.sketches.map((s) => (s.id === sketchId ? { ...s, width } : s)),
      updatedAt: new Date().toISOString(),
    });
  };

  const handleUpdateSketchSideNote = (sketchId: string, sideNote: string) => {
    onUpdateNote({
      ...note, sketches: note.sketches.map((s) => (s.id === sketchId ? { ...s, sideNote } : s)),
      updatedAt: new Date().toISOString(),
    });
  };

  const handleSelectTemplate = (templateContent: string, templateTitle?: string) => {
    const updatedTitle = (!localTitle.trim() || localTitle === t('note.titlePlaceholder')) && templateTitle ? templateTitle : localTitle;
    handleTitleChange({ target: { value: updatedTitle } });
    const nextContent = localContent.trim() ? insertTokenAtCursor(templateContent) : templateContent;
    handleContentChange(nextContent);
    onUpdateNote({ ...note, title: updatedTitle, content: nextContent, updatedAt: new Date().toISOString() });
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      className="flex-1 bg-theme-base flex flex-col h-full overflow-y-auto"
    >
      <NoteActionRibbon
        note={note}
        folderName={folderName}
        folders={folders}
        activeTimerFormatted={activeTimerFormatted}
        isTimerRunning={isTimerRunning}
        isSplitView={isSplitView}
        onToggleSplitView={onToggleSplitView}
        onCloseSplitPane={onCloseSplitPane}
        onToggleComplete={() => {
          const nextState = !note.isCompleted;
          if (nextState) playTaskCompleteSound();
          onUpdateNote({ ...note, isCompleted: nextState, updatedAt: new Date().toISOString() });
        }}
        onTogglePin={() =>
          onUpdateNote({ ...note, isPinned: !note.isPinned, updatedAt: new Date().toISOString() })
        }
        onSelectFolder={(folderId) =>
          onUpdateNote({ ...note, folderId, updatedAt: new Date().toISOString() })
        }
        onDeleteNote={onDeleteNote}
        onOpenFocusTimer={onOpenFocusTimer}
      />

      {blockedFileError && (
        <div className="mx-4 sm:mx-6 lg:mx-10 mt-3 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center justify-between shadow-sm">
          <div className="flex items-center space-x-2 min-w-0">
            <AlertTriangle size={15} className="shrink-0 text-red-400" />
            <span className="truncate">{blockedFileError}</span>
          </div>
          <div className="flex items-center space-x-2 shrink-0 ml-2">
            <button type="button" onClick={() => setIsAudioSettingsOpen(true)} className="px-2 py-0.5 rounded bg-red-500/20 hover:bg-red-500/30 text-red-200 text-[11px] font-medium transition-colors cursor-pointer">
              {t('audioSettings.configure')}
            </button>
            <button type="button" onClick={() => setBlockedFileError(null)} className="p-1 hover:bg-red-500/20 rounded transition-colors cursor-pointer text-red-300">
              <X size={13} />
            </button>
          </div>
        </div>
      )}

      <div className="max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-10 py-6 space-y-4">
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

          <NoteMetadataBar
            updatedAt={note.updatedAt}
            tags={note.tags}
            focusMinutes={note.focusMinutes}
            activeTagFilter={activeTagFilter}
            onSelectTagFilter={onSelectTagFilter}
            onRemoveTag={(tagToRemove) =>
              onUpdateNote({
                ...note,
                tags: note.tags.filter((tg) => tg !== tagToRemove),
                updatedAt: new Date().toISOString(),
              })
            }
            onAddTag={(tag) => {
              if (!note.tags.includes(tag)) {
                onUpdateNote({ ...note, tags: [...note.tags, tag], updatedAt: new Date().toISOString() });
              }
            }}
          />
        </div>

        {/* Single Unified Insertion & Media Toolbar Row */}
        <NoteUnifiedToolbar
          onOpenAttachModal={() => setIsAttachmentModalOpen(true)}
          onAttachmentCreated={handleAddAttachment}
          onError={(msg) => setBlockedFileError(msg)}
          onOpenWhiteboard={onOpenWhiteboard}
          onInsertTask={handleInsertTaskAtCursor}
          onSelectTemplate={handleSelectTemplate}
          showLinkInput={showLinkInput}
          onToggleAddLink={() => setShowLinkInput(!showLinkInput)}
          newLinkTitle={newLinkTitle}
          newLinkUrl={newLinkUrl}
          onSetNewLinkTitle={setNewLinkTitle}
          onSetNewLinkUrl={setNewLinkUrl}
          onAddLink={handleAddLink}
          onCloseLinkInput={() => setShowLinkInput(false)}
        />

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
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => {
                setIsStarterDismissed(false);
                localStorage.removeItem('udo_hide_starter_templates');
              }}
              className="text-[11px] text-theme-muted hover:text-theme-accent transition-colors flex items-center space-x-1.5 py-0.5 cursor-pointer"
            >
              <Lightbulb size={12} className="text-amber-400" />
              <span>{t('templates.showStarterPrompt')}</span>
            </button>
          </div>
        )}

        {/* Universal Notion-style Flat Sheet Editor */}
        <UniversalFlatSheet
          content={localContent}
          notes={notes}
          sketches={note.sketches || []}
          links={note.links || []}
          attachments={note.attachments || []}
          findQuery={findQuery}
          currentMatchIndex={currentMatchIndex}
          activeCursorLineRef={activeCursorLineRef}
          onChangeContent={handleContentChange}
          onSelectNote={onSelectNote}
          onCreateNoteWithTitle={onCreateNoteWithTitle}
          onMatchCountCalculated={setTotalMatches}
          onUndoText={handleUndoText}
          onRedoText={handleRedoText}
          onAttachSketchesAtLine={handleAttachSketchesAtLine}
          onOpenSketchAnnotator={onOpenSketchAnnotator}
          onRemoveSketch={handleRemoveSketch}
          onResizeSketch={handleResizeSketch}
          onUpdateSketchSideNote={handleUpdateSketchSideNote}
          onRemoveLink={handleRemoveLink}
          onRemoveAttachment={handleRemoveAttachment}
          onRenameAttachment={(id, name) => handleUpdateAttachment(id, { name })}
        />
      </div>

      <AttachmentModal
        isOpen={isAttachmentModalOpen}
        onClose={() => setIsAttachmentModalOpen(false)}
        onAttachSketch={attachSingleSketch}
        onAttachmentCreated={handleAddAttachment}
        onAttachFiles={handleAttachFiles}
      />

      <AudioDeviceSettingsModal
        isOpen={isAudioSettingsOpen}
        onClose={() => setIsAudioSettingsOpen(false)}
      />
    </div>
  );
};
