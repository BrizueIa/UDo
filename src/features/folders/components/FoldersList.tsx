import React, { useState, useMemo } from 'react';
import { FolderItem, NoteItem, SubjectItem, ViewFilter } from '../../../shared/types';
import { FolderItemRow } from './FolderItemRow';
import { RootNotesList } from './RootNotesList';
import { FolderNotesAccordion } from './FolderNotesAccordion';
import { FolderPlus, X, Hash, FilePlus } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { normalizeDiacritics } from '../../../shared/utils/diacritics';
import { renderRichTitle } from '../../note-sheet/utils/inlineRichTextParser';
import { useMultiSelection } from '../hooks/useMultiSelection';
import { useFoldersContextMenu } from '../hooks/useFoldersContextMenu';
import { BatchActionBar } from './BatchActionBar';
import { MarqueeSelectionBox } from './MarqueeSelectionBox';
import { InlineCreateFolder } from './InlineCreateFolder';
import { FolderEmptyState } from './FolderEmptyState';
import { filterAndSortFolderNotes } from '../utils/filterNotes';

interface Props {
  currentSubject?: SubjectItem;
  folders: FolderItem[];
  notes: NoteItem[];
  selectedFolderId?: string;
  selectedNoteId: string;
  secondaryNoteId?: string;
  activeNoteFolderId?: string;
  secondaryNoteFolderId?: string;
  filter: ViewFilter;
  searchQuery?: string;
  activeTagFilter?: string | null;
  isFocused?: boolean;
  onClearTagFilter?: () => void;
  onSelectFolder: (id: string) => void;
  onSelectNote: (id: string) => void;
  onToggleNoteComplete: (id: string) => void;
  onToggleFolderExpand: (id: string) => void;
  onAddFolder: (name: string) => void;
  onUpdateFolder: (folder: FolderItem) => void;
  onDeleteFolder: (id: string) => void;
  onAddNote: (folderId: string) => void;
  onMoveNoteToFolder?: (noteId: string, folderId: string) => void;
  onReorderOrMoveNote?: (draggedNoteId: string, targetFolderId: string, targetNoteId?: string, position?: 'before' | 'after') => void;
  onReorderFolder?: (draggedFolderId: string, targetFolderId: string, position?: 'before' | 'after') => void;
  onBatchDeleteNotes?: (ids: string[]) => void;
  onBatchDeleteFolders?: (ids: string[]) => void;
  onBatchToggleCompleteNotes?: (ids: string[]) => void;
  onBatchMoveNotesToFolder?: (ids: string[], folderId: string) => void;
  onDuplicateNote?: (id: string) => void;
  onOpenInSplitView?: (noteId: string) => void;
}

export const FoldersList: React.FC<Props> = ({
  currentSubject, folders, notes, selectedFolderId, selectedNoteId, secondaryNoteId,
  activeNoteFolderId, secondaryNoteFolderId,
  filter, searchQuery = '', activeTagFilter, isFocused = false, onClearTagFilter,
  onSelectFolder, onSelectNote, onToggleNoteComplete, onToggleFolderExpand,
  onAddFolder, onUpdateFolder, onDeleteFolder, onAddNote, onMoveNoteToFolder,
  onReorderOrMoveNote, onReorderFolder, onBatchDeleteNotes, onBatchDeleteFolders, onBatchToggleCompleteNotes,
  onBatchMoveNotesToFolder, onDuplicateNote, onOpenInSplitView,
}) => {
  const { t } = useTranslation();
  const [isCreating, setIsCreating] = useState(false);

  // Root notes belonging to the current subject without a folder
  const currentSubjectId = currentSubject?.id;
  const rootNotes = useMemo(() => {
    if (!currentSubjectId) return [];
    return notes.filter(
      (n) => n.subjectId === currentSubjectId && (!n.folderId || n.folderId === '')
    );
  }, [notes, currentSubjectId]);

  const visibleRootNotes = useMemo(() => {
    return filterAndSortFolderNotes({
      notes: rootNotes,
      filter,
      searchQuery,
      activeTagFilter,
    });
  }, [rootNotes, filter, searchQuery, activeTagFilter]);

  const currentFolderNoteIds = useMemo(() => {
    if (selectedFolderId) {
      const folderNotes = notes.filter((n) => n.folderId === selectedFolderId);
      return filterAndSortFolderNotes({
        notes: folderNotes,
        filter,
        searchQuery,
        activeTagFilter,
      }).map((n) => n.id);
    }
    if (visibleRootNotes.length > 0) {
      return visibleRootNotes.map((n) => n.id);
    }
    const targetFolderId = activeNoteFolderId || folders[0]?.id;
    if (!targetFolderId) return [];
    const folderNotes = notes.filter((n) => n.folderId === targetFolderId);
    return filterAndSortFolderNotes({
      notes: folderNotes,
      filter,
      searchQuery,
      activeTagFilter,
    }).map((n) => n.id);
  }, [notes, selectedFolderId, visibleRootNotes, activeNoteFolderId, folders, filter, searchQuery, activeTagFilter]);

  const orderedVisibleNoteIds = useMemo(() => {
    const ids: string[] = visibleRootNotes.map((n) => n.id);
    folders.forEach((f) => {
      if (f.isExpanded) {
        const folderNotes = notes.filter((n) => n.folderId === f.id);
        const filtered = filterAndSortFolderNotes({
          notes: folderNotes,
          filter,
          searchQuery,
          activeTagFilter,
        });
        filtered.forEach((n) => ids.push(n.id));
      }
    });
    return ids;
  }, [visibleRootNotes, folders, notes, filter, searchQuery, activeTagFilter]);

  const allVisibleFolderIds = useMemo(() => {
    return folders.map((f) => f.id);
  }, [folders]);

  const {
    selectedNoteIds,
    selectedFolderIds,
    clearSelection,
    handleNoteClick,
    handleFolderClick,
    handleContainerMouseDown,
    marqueeRect,
  } = useMultiSelection({
    allVisibleNoteIds: orderedVisibleNoteIds,
    currentFolderNoteIds,
    allVisibleFolderIds,
    activeNoteId: selectedNoteId,
    onBatchDelete: (noteIds, folderIds) => {
      if (noteIds.length > 0) onBatchDeleteNotes?.(noteIds);
      if (folderIds && folderIds.length > 0) {
        if (onBatchDeleteFolders) {
          onBatchDeleteFolders(folderIds);
        } else {
          folderIds.forEach((fId) => onDeleteFolder(fId));
        }
      }
    },
  });

  const { handleNoteContextMenu, handleFolderContextMenu } = useFoldersContextMenu({
    folders,
    selectedNoteIds,
    selectedFolderIds,
    onToggleNoteComplete,
    onBatchToggleCompleteNotes,
    onMoveNoteToFolder,
    onBatchMoveNotesToFolder,
    onBatchDeleteNotes,
    onBatchDeleteFolders,
    onDuplicateNote,
    onOpenInSplitView,
    onAddNote,
    onToggleFolderExpand,
    onDeleteFolder,
  });

  // Count notes matching activeTagFilter across current subject
  const totalTagMatchingNotes = activeTagFilter
    ? notes.filter(
        (n) =>
          n.subjectId === currentSubjectId &&
          n.tags.some(
            (tag) => normalizeDiacritics(tag) === normalizeDiacritics(activeTagFilter)
          )
      ).length
    : 0;

  return (
    <div
      className={`w-56 lg:w-72 flex-shrink-0 bg-theme-column border-r border-theme-border flex flex-col h-full select-none transition-all ${
        isFocused ? 'ring-1 ring-inset ring-theme-accent/40 shadow-sm' : ''
      }`}
    >
      {/* Header with active subject title, New Note button and New Folder button */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
        <h2 className="text-sm font-semibold text-theme-text truncate">
          {renderRichTitle(currentSubject?.name || t('nav.subjects'), 'folders-hdr', 0, { ignoreSize: true })}
        </h2>
        <div className="flex items-center space-x-1 shrink-0">
          <button
            onClick={() => onAddNote('')}
            className="p-1 rounded-md text-theme-muted hover:text-theme-text hover:bg-theme-hover transition-colors"
            title={`${t('folders.addNote')} (Ctrl+N)`}
          >
            <FilePlus size={16} />
          </button>
          <button
            onClick={() => setIsCreating(true)}
            className="p-1 rounded-md text-theme-muted hover:text-theme-text hover:bg-theme-hover transition-colors"
            title={t('folders.addFolder')}
          >
            <FolderPlus size={16} />
          </button>
        </div>
      </div>

      {/* Active Transversal Tag Filter Chip */}
      {activeTagFilter && (
        <div className="mx-2.5 mt-2 px-2.5 py-1.5 rounded-lg bg-theme-accent/15 border border-theme-accent/30 flex items-center justify-between text-xs animate-in fade-in">
          <div className="flex items-center space-x-1.5 min-w-0">
            <Hash size={13} className="text-theme-accent flex-shrink-0" />
            <span className="font-semibold text-theme-accent truncate">
              {activeTagFilter}
            </span>
            <span className="text-[11px] text-theme-muted font-mono">
              ({totalTagMatchingNotes})
            </span>
          </div>
          <button
            onClick={onClearTagFilter}
            className="p-0.5 rounded hover:bg-theme-accent/20 text-theme-muted hover:text-theme-text transition-colors flex-shrink-0"
            title={t('nav.clearFilter')}
          >
            <X size={13} />
          </button>
        </div>
      )}

      {/* Inline Create Folder Form */}
      <InlineCreateFolder
        isOpen={isCreating}
        onClose={() => setIsCreating(false)}
        onSave={(name) => {
          onAddFolder(name);
          setIsCreating(false);
        }}
      />

      {/* Folders & Notes list with container drop receiver */}
      <div
        data-folders-container
        onMouseDown={handleContainerMouseDown}
        onDragOver={(e) => {
          if (
            e.dataTransfer.types.includes('application/udo-note-id') ||
            e.dataTransfer.types.includes('application/udo-note-ids') ||
            e.dataTransfer.types.includes('text/plain')
          ) {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
          }
        }}
        onDrop={(e) => {
          if (e.target !== e.currentTarget && !(e.target as HTMLElement).hasAttribute('data-folders-empty')) {
            return;
          }
          e.preventDefault();
          if (e.dataTransfer.types.includes('application/udo-folder-id')) return;
          const noteIdsRaw = e.dataTransfer.getData('application/udo-note-ids');
          if (noteIdsRaw && onBatchMoveNotesToFolder) {
            try {
              const ids: string[] = JSON.parse(noteIdsRaw);
              onBatchMoveNotesToFolder(ids, '');
              return;
            } catch {}
          }
          const noteId =
            e.dataTransfer.getData('application/udo-note-id') ||
            e.dataTransfer.getData('text/plain');
          if (noteId && onMoveNoteToFolder) {
            onMoveNoteToFolder(noteId, '');
          }
        }}
        className="flex-1 overflow-y-auto px-2 py-2 space-y-2 relative"
      >
        {(!currentSubject || (folders.length === 0 && visibleRootNotes.length === 0 && !isCreating)) ? (
          <FolderEmptyState
            currentSubject={currentSubject}
            onCreateFolder={() => setIsCreating(true)}
            onCreateNote={() => onAddNote('')}
          />
        ) : (
          <>
            {/* Root Notes (Notes directly in project) */}
            <RootNotesList
              notes={visibleRootNotes}
              selectedNoteId={selectedNoteId}
              secondaryNoteId={secondaryNoteId}
              selectedNoteIds={selectedNoteIds}
              onSelectFolder={onSelectFolder}
              onSelectNote={onSelectNote}
              onNoteClick={handleNoteClick}
              onToggleNoteComplete={onToggleNoteComplete}
              onNoteContextMenu={handleNoteContextMenu}
              onReorderOrMoveNote={onReorderOrMoveNote}
            />

            {/* Folders List */}
            {folders.map((folder) => {
              const folderNotes = notes.filter((n) => n.folderId === folder.id);
              const visibleNotes = filterAndSortFolderNotes({
                notes: folderNotes,
                filter,
                searchQuery,
                activeTagFilter,
              });
              const isFolderSelected = selectedFolderId === folder.id;

              return (
                <div key={folder.id} className="space-y-1">
                  <FolderItemRow
                    folder={folder}
                    noteCount={folderNotes.length}
                    isSelected={isFolderSelected}
                    isMultiSelected={selectedFolderIds.has(folder.id)}
                    hasActiveNote={folder.id === activeNoteFolderId || folder.id === secondaryNoteFolderId}
                    onSelectFolder={() => onSelectFolder(folder.id)}
                    onSelectWithEvent={(e) => handleFolderClick(folder.id, e)}
                    onToggleExpand={() => onToggleFolderExpand(folder.id)}
                    onAddNote={() => onAddNote(folder.id)}
                    onUpdateFolder={onUpdateFolder}
                    onDeleteFolder={() => onDeleteFolder(folder.id)}
                    onReorderFolder={onReorderFolder}
                    onContextMenu={(e) => handleFolderContextMenu(e, folder)}
                    onBatchMoveNotesToFolder={onBatchMoveNotesToFolder}
                    onMoveNoteToFolder={(noteId) => {
                      setTimeout(() => {
                        if (onReorderOrMoveNote) {
                          onReorderOrMoveNote(noteId, folder.id);
                        } else if (onMoveNoteToFolder) {
                          onMoveNoteToFolder(noteId, folder.id);
                        }
                      }, 0);
                    }}
                  />

                  <FolderNotesAccordion
                    folder={folder}
                    visibleNotes={visibleNotes}
                    selectedNoteId={selectedNoteId}
                    secondaryNoteId={secondaryNoteId}
                    selectedNoteIds={selectedNoteIds}
                    onSelectFolder={onSelectFolder}
                    onSelectNote={onSelectNote}
                    onNoteClick={handleNoteClick}
                    onToggleNoteComplete={onToggleNoteComplete}
                    onNoteContextMenu={handleNoteContextMenu}
                    onAddNote={onAddNote}
                    onReorderOrMoveNote={onReorderOrMoveNote}
                    onBatchMoveNotesToFolder={onBatchMoveNotesToFolder}
                  />
                </div>
              );
            })}
          </>
        )}

        <BatchActionBar
          selectedCount={selectedNoteIds.size + selectedFolderIds.size}
          folders={folders}
          onToggleCompleteAll={() => onBatchToggleCompleteNotes?.(Array.from(selectedNoteIds))}
          onMoveAllToFolder={(folderId) => onBatchMoveNotesToFolder?.(Array.from(selectedNoteIds), folderId)}
          onDeleteAll={() => {
            if (selectedNoteIds.size > 0) onBatchDeleteNotes?.(Array.from(selectedNoteIds));
            if (selectedFolderIds.size > 0) {
              const fIds = Array.from(selectedFolderIds);
              if (onBatchDeleteFolders) {
                onBatchDeleteFolders(fIds);
              } else {
                fIds.forEach((fId) => onDeleteFolder(fId));
              }
            }
            clearSelection();
          }}
          onClearSelection={clearSelection}
        />
        <MarqueeSelectionBox rect={marqueeRect} />
      </div>
    </div>
  );
};
