import React, { useState, useMemo } from 'react';
import { FolderItem, NoteItem, SubjectItem, ViewFilter } from '../../../shared/types';
import { FolderItemRow } from './FolderItemRow';
import { NoteItemRow } from './NoteItemRow';
import { FolderPlus, X, Hash, Plus } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { normalizeDiacritics } from '../../../shared/utils/diacritics';
import { renderRichTitle } from '../../note-sheet/utils/inlineRichTextParser';
import { useMultiSelection } from '../hooks/useMultiSelection';
import { useFoldersContextMenu } from '../hooks/useFoldersContextMenu';
import { BatchActionBar } from './BatchActionBar';
import { MarqueeSelectionBox } from './MarqueeSelectionBox';
import { InlineCreateFolder } from './InlineCreateFolder';
import { filterAndSortFolderNotes } from '../utils/filterNotes';

interface Props {
  currentSubject?: SubjectItem;
  folders: FolderItem[];
  notes: NoteItem[];
  selectedFolderId?: string;
  selectedNoteId: string;
  activeNoteFolderId?: string;
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
  onReorderOrMoveNote?: (
    draggedNoteId: string,
    targetFolderId: string,
    targetNoteId?: string,
    position?: 'before' | 'after'
  ) => void;
  onReorderFolder?: (
    draggedFolderId: string,
    targetFolderId: string,
    position?: 'before' | 'after'
  ) => void;
  onBatchDeleteNotes?: (ids: string[]) => void;
  onBatchToggleCompleteNotes?: (ids: string[]) => void;
  onBatchMoveNotesToFolder?: (ids: string[], folderId: string) => void;
  onDuplicateNote?: (id: string) => void;
}

export const FoldersList: React.FC<Props> = ({
  currentSubject,
  folders,
  notes,
  selectedFolderId,
  selectedNoteId,
  activeNoteFolderId,
  filter,
  searchQuery = '',
  activeTagFilter,
  isFocused = false,
  onClearTagFilter,
  onSelectFolder,
  onSelectNote,
  onToggleNoteComplete,
  onToggleFolderExpand,
  onAddFolder,
  onUpdateFolder,
  onDeleteFolder,
  onAddNote,
  onMoveNoteToFolder,
  onReorderOrMoveNote,
  onReorderFolder,
  onBatchDeleteNotes,
  onBatchToggleCompleteNotes,
  onBatchMoveNotesToFolder,
  onDuplicateNote,
}) => {
  const { t } = useTranslation();

  const currentFolderNoteIds = useMemo(() => {
    const targetFolderId = selectedFolderId || activeNoteFolderId || folders[0]?.id;
    if (!targetFolderId) return [];
    const folderNotes = notes.filter((n) => n.folderId === targetFolderId);
    return filterAndSortFolderNotes({
      notes: folderNotes,
      filter,
      searchQuery,
      activeTagFilter,
    }).map((n) => n.id);
  }, [notes, selectedFolderId, activeNoteFolderId, folders, filter, searchQuery, activeTagFilter]);

  const orderedVisibleNoteIds = useMemo(() => {
    const ids: string[] = [];
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
  }, [folders, notes, filter, searchQuery, activeTagFilter]);

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
        folderIds.forEach((fId) => onDeleteFolder(fId));
      }
    },
  });

  const { handleNoteContextMenu, handleFolderContextMenu } = useFoldersContextMenu({
    folders,
    selectedNoteIds,
    onToggleNoteComplete,
    onBatchToggleCompleteNotes,
    onMoveNoteToFolder,
    onBatchMoveNotesToFolder,
    onBatchDeleteNotes,
    onDuplicateNote,
    onAddNote,
    onToggleFolderExpand,
    onDeleteFolder,
  });

  // Create folder inline state
  const [isCreating, setIsCreating] = useState(false);
  const [dragOverFolderNotesId, setDragOverFolderNotesId] = useState<string | null>(null);

  // Count notes matching activeTagFilter across current subject
  const totalTagMatchingNotes = activeTagFilter
    ? notes.filter(
        (n) =>
          folders.some((f) => f.id === n.folderId) &&
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
      {/* Header with active subject title and new folder button */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
        <h2 className="text-sm font-semibold text-theme-text truncate">
          {renderRichTitle(currentSubject?.name || t('nav.subjects'), 'folders-hdr', 0, { ignoreSize: true })}
        </h2>
        <button
          onClick={() => setIsCreating(true)}
          className="p-1 rounded-md text-theme-muted hover:text-theme-text hover:bg-theme-hover transition-colors"
          title={t('folders.addFolder')}
        >
          <FolderPlus size={16} />
        </button>
      </div>

      {/* Active Transversal Tag Filter Chip (FR-21) */}
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

      {/* Folders & Notes list */}
      <div
        data-folders-container
        onMouseDown={handleContainerMouseDown}
        className="flex-1 overflow-y-auto px-2 py-2 space-y-2 relative"
      >
        {folders.length === 0 && !isCreating ? (
          <div className="text-center py-8 text-xs text-theme-muted">
            {t('folders.empty')}
          </div>
        ) : (
          folders.map((folder) => {
            const folderNotes = notes.filter((n) => n.folderId === folder.id);
            const visibleNotes = filterAndSortFolderNotes({
              notes: folderNotes,
              filter,
              searchQuery,
              activeTagFilter,
            });
            const isFolderSelected = selectedFolderId === folder.id;
            const isDragOverNotes = dragOverFolderNotesId === folder.id;

            return (
              <div key={folder.id} className="space-y-1">
                <FolderItemRow
                  folder={folder}
                  noteCount={folderNotes.length}
                  isSelected={isFolderSelected}
                  isMultiSelected={selectedFolderIds.has(folder.id)}
                  hasActiveNote={folder.id === activeNoteFolderId}
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

                {/* Notes in folder (Animated Accordion + drop receiver anywhere in folder) */}
                <AnimatePresence initial={false}>
                  {folder.isExpanded && (
                    <motion.div
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      transition={{ duration: 0.15, ease: 'easeOut' }}
                      onDragOver={(e) => {
                        if (
                          e.dataTransfer.types.includes('application/udo-note-id') ||
                          e.dataTransfer.types.includes('application/udo-note-ids') ||
                          e.dataTransfer.types.includes('text/plain')
                        ) {
                          e.preventDefault();
                          e.dataTransfer.dropEffect = 'move';
                          if (dragOverFolderNotesId !== folder.id) {
                            setDragOverFolderNotesId(folder.id);
                          }
                        }
                      }}
                      onDragLeave={(e) => {
                        if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                          setDragOverFolderNotesId(null);
                        }
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setDragOverFolderNotesId(null);
                        const isFolder = e.dataTransfer.types.includes('application/udo-folder-id');
                        if (isFolder) return;

                        const noteIdsRaw = e.dataTransfer.getData('application/udo-note-ids');
                        if (noteIdsRaw && onBatchMoveNotesToFolder) {
                          try {
                            const ids: string[] = JSON.parse(noteIdsRaw);
                            onBatchMoveNotesToFolder(ids, folder.id);
                            return;
                          } catch {}
                        }

                        const noteId =
                          e.dataTransfer.getData('application/udo-note-id') ||
                          e.dataTransfer.getData('text/plain');
                        if (noteId && onReorderOrMoveNote) {
                          setTimeout(() => {
                            onReorderOrMoveNote(noteId, folder.id);
                          }, 0);
                        }
                      }}
                      className={`overflow-hidden pl-3 space-y-0.5 border-l ml-4 transition-colors rounded-r-lg ${
                        isDragOverNotes
                          ? 'border-theme-accent bg-theme-accent/10 ring-1 ring-theme-accent/30'
                          : 'border-white/[0.06]'
                      }`}
                    >
                      {visibleNotes.length === 0 ? (
                        <div
                          onClick={() => onAddNote(folder.id)}
                          className="flex items-center justify-between text-[11px] text-theme-muted/70 hover:text-theme-accent py-1.5 px-2 rounded-lg hover:bg-theme-hover/40 cursor-pointer transition-colors group"
                          title={`${t('folders.addNote')} (Ctrl+N)`}
                        >
                          <span>{t('folders.noNotes')}</span>
                          <span className="text-[10px] text-theme-accent opacity-0 group-hover:opacity-100 flex items-center space-x-1 transition-opacity">
                            <Plus size={11} />
                            <span>{t('folders.addNote')}</span>
                          </span>
                        </div>
                      ) : (
                        visibleNotes.map((note) => (
                          <NoteItemRow
                            key={note.id}
                            note={note}
                            isSelected={note.id === selectedNoteId}
                            isMultiSelected={selectedNoteIds.has(note.id)}
                            multiSelectedIds={Array.from(selectedNoteIds)}
                            onSelect={() => {
                              onSelectFolder(folder.id);
                              onSelectNote(note.id);
                            }}
                            onSelectWithEvent={(e) => {
                              onSelectFolder(folder.id);
                              onSelectNote(note.id);
                              handleNoteClick(note.id, e);
                            }}
                            onToggleComplete={() => onToggleNoteComplete(note.id)}
                            onContextMenu={(e) => handleNoteContextMenu(e, note)}
                            onDropOnNote={(draggedId, targetId, pos) => {
                              if (onReorderOrMoveNote) {
                                onReorderOrMoveNote(draggedId, folder.id, targetId, pos);
                              }
                            }}
                          />
                        ))
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })
        )}

        <BatchActionBar
          selectedCount={selectedNoteIds.size + selectedFolderIds.size}
          folders={folders}
          onToggleCompleteAll={() => onBatchToggleCompleteNotes?.(Array.from(selectedNoteIds))}
          onMoveAllToFolder={(folderId) => onBatchMoveNotesToFolder?.(Array.from(selectedNoteIds), folderId)}
          onDeleteAll={() => {
            if (selectedNoteIds.size > 0) onBatchDeleteNotes?.(Array.from(selectedNoteIds));
            if (selectedFolderIds.size > 0) {
              selectedFolderIds.forEach((fId) => onDeleteFolder(fId));
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
