import React, { useState, useRef, useEffect } from 'react';
import { NoteItem, SubjectItem, FolderItem, SketchItem } from '../../../shared/types';
import { NoteDetailView } from './NoteDetailView';
import { EmptyNoteView } from './EmptyNoteView';
import { Columns2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface Props {
  primaryNote?: NoteItem;
  secondaryNote?: NoteItem;
  notes: NoteItem[];
  subjects: SubjectItem[];
  folders: FolderItem[];
  currentSubjectFolders: FolderItem[];
  showBreadcrumbs: boolean;
  activeTagFilter: string | null;
  focusTimer: {
    isRunning: boolean;
    isPaused: boolean;
    noteId: string | null;
    formattedTime: string;
  };
  onRevealNoteLocation: (note: NoteItem) => void;
  onOpenFocusTimer: () => void;
  onUpdateNote: (note: NoteItem) => void;
  onDeleteNote: (id: string) => void;
  onSelectNote: (noteId: string, subjectId: string) => void;
  onCreateNoteWithTitle: (title: string) => void;
  onCreateNewNote: () => void;
  onSelectTagFilter: (tag: string) => void;
  onOpenSketchAnnotator: (sketch: SketchItem) => void;
  onOpenWhiteboard: () => void;
  onWorkspaceUndo?: () => void;
  onWorkspaceRedo?: () => void;
  onOpenInSplitView: (noteId: string) => void;
  onCloseSplitView: (keepWhich?: 'primary' | 'secondary') => void;
  onCreateSubject?: () => void;
  onCreateFolder?: () => void;
}

export const SplitNoteWorkspace: React.FC<Props> = ({
  primaryNote, secondaryNote, notes, subjects, folders, currentSubjectFolders,
  showBreadcrumbs, activeTagFilter, focusTimer, onRevealNoteLocation,
  onOpenFocusTimer, onUpdateNote, onDeleteNote, onSelectNote,
  onCreateNoteWithTitle, onCreateNewNote, onSelectTagFilter,
  onOpenSketchAnnotator, onOpenWhiteboard, onWorkspaceUndo, onWorkspaceRedo,
  onOpenInSplitView, onCloseSplitView, onCreateSubject, onCreateFolder,
}) => {
  const { t } = useTranslation();
  const containerRef = useRef<HTMLDivElement>(null);
  const [splitRatio, setSplitRatio] = useState<number>(50);
  const [isDragOverRightZone, setIsDragOverRightZone] = useState(false);

  const isSplitActive = Boolean(primaryNote && secondaryNote && primaryNote.id !== secondaryNote.id);

  // Reset split ratio to 50/50 whenever a new split view session is opened
  useEffect(() => {
    if (isSplitActive) {
      setSplitRatio(50);
    }
  }, [isSplitActive, secondaryNote?.id]);

  const handleStartDividerDrag = (e: React.MouseEvent) => {
    e.preventDefault();
    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();

    const onMove = (ev: MouseEvent) => {
      const pct = ((ev.clientX - rect.left) / rect.width) * 100;
      setSplitRatio(Math.max(30, Math.min(70, pct)));
    };

    const onUp = () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };

    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  };

  const handleWorkspaceDragOver = (e: React.DragEvent) => {
    const isDraggingNote =
      e.dataTransfer.types.includes('application/udo-note-id') ||
      e.dataTransfer.types.includes('application/udo-note-ids');
    if (!isDraggingNote) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const isRightHalf = e.clientX > rect.left + rect.width * 0.45;
    if (isRightHalf) {
      e.preventDefault();
      e.stopPropagation();
      e.dataTransfer.dropEffect = 'move';
      if (!isDragOverRightZone) setIsDragOverRightZone(true);
    } else if (isDragOverRightZone) {
      setIsDragOverRightZone(false);
    }
  };

  const handleWorkspaceDrop = (e: React.DragEvent) => {
    if (!isDragOverRightZone) return;
    e.preventDefault();
    e.stopPropagation();
    setIsDragOverRightZone(false);
    const droppedNoteId =
      e.dataTransfer.getData('application/udo-note-id') || e.dataTransfer.getData('text/plain');
    if (droppedNoteId) {
      onOpenInSplitView(droppedNoteId);
    }
  };

  const renderNotePane = (
    targetNote: NoteItem,
    paneType: 'primary' | 'secondary'
  ) => {
    const subj = subjects.find((s) => s.id === targetNote.subjectId);
    const fold = folders.find((f) => f.id === targetNote.folderId);
    const isTimerOnThis =
      (focusTimer.isRunning || focusTimer.isPaused) && focusTimer.noteId === targetNote.id;

    return (
      <NoteDetailView
        key={`${paneType}-${targetNote.id}`}
        note={targetNote}
        notes={notes}
        folderName={fold?.name || ''}
        folders={currentSubjectFolders}
        subjectName={subj?.name}
        subjectColor={subj?.color}
        onRevealLocation={() => onRevealNoteLocation(targetNote)}
        showBreadcrumbs={showBreadcrumbs}
        activeTagFilter={activeTagFilter}
        activeTimerFormatted={isTimerOnThis ? focusTimer.formattedTime : undefined}
        isTimerRunning={focusTimer.isRunning && focusTimer.noteId === targetNote.id}
        onCloseSplitPane={
          isSplitActive
            ? () => onCloseSplitView(paneType === 'primary' ? 'secondary' : 'primary')
            : undefined
        }
        onOpenFocusTimer={onOpenFocusTimer}
        onUpdateNote={onUpdateNote}
        onDeleteNote={onDeleteNote}
        onSelectNote={onSelectNote}
        onCreateNoteWithTitle={onCreateNoteWithTitle}
        onSelectTagFilter={onSelectTagFilter}
        onOpenSketchAnnotator={onOpenSketchAnnotator}
        onOpenWhiteboard={onOpenWhiteboard}
        onWorkspaceUndo={onWorkspaceUndo}
        onWorkspaceRedo={onWorkspaceRedo}
      />
    );
  };

  if (!primaryNote) {
    return (
      <EmptyNoteView
        onCreateNote={onCreateNewNote}
        hasSubjects={subjects.length > 0}
        hasFolders={folders.length > 0}
        onCreateSubject={onCreateSubject}
        onCreateFolder={onCreateFolder}
      />
    );
  }

  return (
    <div
      ref={containerRef}
      onDragOver={handleWorkspaceDragOver}
      onDragLeave={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) {
          setIsDragOverRightZone(false);
        }
      }}
      onDrop={handleWorkspaceDrop}
      className="relative flex-1 flex h-full overflow-hidden"
    >
      {/* Left / Primary Note Pane */}
      <div
        style={{ width: isSplitActive ? `${splitRatio}%` : '100%' }}
        className="flex flex-col h-full overflow-hidden"
      >
        {renderNotePane(primaryNote, 'primary')}
      </div>

      {/* Central Resizable Divider & Secondary Note Pane */}
      {isSplitActive && secondaryNote && (
        <>
          <div
            onMouseDown={handleStartDividerDrag}
            onDoubleClick={() => setSplitRatio(50)}
            title={t('splitView.resizeHint')}
            className="relative w-3 -mx-1 h-full cursor-col-resize flex items-center justify-center shrink-0 z-20 group select-none"
          >
            {/* Full-height subtle seam line like Column 1 & 2 */}
            <div className="w-px h-full bg-theme-border group-hover:bg-theme-accent/70 transition-colors" />
            {/* Discreet center grip handle */}
            <div className="absolute w-1 h-10 rounded-full bg-theme-muted/35 group-hover:bg-theme-accent group-hover:h-16 transition-all" />
          </div>

          <div
            style={{ width: `${100 - splitRatio}%` }}
            className="flex flex-col h-full overflow-hidden"
          >
            {renderNotePane(secondaryNote, 'secondary')}
          </div>
        </>
      )}

      {/* Visual Right-Half Drop Zone Overlay for Split-View */}
      {isDragOverRightZone && (
        <div className="pointer-events-none absolute top-3 bottom-3 right-3 w-[48%] rounded-2xl bg-theme-accent/15 border-2 border-dashed border-theme-accent flex flex-col items-center justify-center space-y-2 z-30 backdrop-blur-[2px] animate-in fade-in duration-150">
          <div className="w-11 h-11 rounded-full bg-theme-accent/25 text-theme-accent flex items-center justify-center shadow-lg">
            <Columns2 size={22} />
          </div>
          <span className="text-xs font-semibold text-theme-text px-4 py-1 rounded-full bg-theme-card/90 border border-theme-accent/40 shadow-sm">
            {t('splitView.dropToOpenSplit')}
          </span>
        </div>
      )}
    </div>
  );
};
