import React, { useState } from 'react';
import { FolderItem, NoteItem, SubjectItem, ViewFilter } from '../../../shared/types';
import { FolderItemRow } from './FolderItemRow';
import { NoteItemRow } from './NoteItemRow';
import { FolderPlus, Check, X, Hash, Plus } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { normalizeDiacritics } from '../../../shared/utils/diacritics';

interface Props {
  currentSubject?: SubjectItem;
  folders: FolderItem[];
  notes: NoteItem[];
  selectedFolderId?: string;
  selectedNoteId: string;
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
}

export const FoldersList: React.FC<Props> = ({
  currentSubject,
  folders,
  notes,
  selectedFolderId,
  selectedNoteId,
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
}) => {
  const { t } = useTranslation();

  // Create folder inline state
  const [isCreating, setIsCreating] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [dragOverFolderNotesId, setDragOverFolderNotesId] = useState<string | null>(null);

  // Filter notes according to status, diacritic-insensitive search, and active tag
  const filterNotes = (folderNotes: NoteItem[]) => {
    const query = normalizeDiacritics(searchQuery.trim());
    const normActiveTag = activeTagFilter ? normalizeDiacritics(activeTagFilter) : null;

    return folderNotes
      .filter((n) => {
        // Status pill filter
        if (filter === 'pending' && n.isCompleted) return false;
        if (filter === 'completed' && !n.isCompleted) return false;

        // Active transversal tag filter (diacritic-insensitive)
        if (
          normActiveTag &&
          !n.tags.some((tag) => normalizeDiacritics(tag) === normActiveTag)
        ) {
          return false;
        }

        // Scoped search query filter (diacritic-insensitive)
        if (query) {
          const matchTitle = normalizeDiacritics(n.title).includes(query);
          const matchContent = normalizeDiacritics(n.content).includes(query);
          const matchTags = n.tags.some((tag) => normalizeDiacritics(tag).includes(query));
          if (!matchTitle && !matchContent && !matchTags) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (a.isPinned !== b.isPinned) return Number(b.isPinned) - Number(a.isPinned);
        if (typeof a.order === 'number' && typeof b.order === 'number') {
          return a.order - b.order;
        }
        return 0;
      });
  };

  const handleSaveCreate = () => {
    const trimmed = newFolderName.trim();
    if (trimmed) {
      onAddFolder(trimmed);
    }
    setIsCreating(false);
    setNewFolderName('');
  };

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
      className={`w-72 flex-shrink-0 bg-theme-column border-r border-theme-border flex flex-col h-full select-none transition-all ${
        isFocused ? 'ring-1 ring-inset ring-theme-accent/40 shadow-sm' : ''
      }`}
    >
      {/* Header with active subject title and new folder button */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-theme-border/50">
        <h2 className="text-sm font-semibold text-theme-text truncate">
          {currentSubject?.name || t('nav.subjects')}
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
      <AnimatePresence>
        {isCreating && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.12, ease: 'easeOut' }}
            className="p-2.5 mx-2 my-2 bg-theme-card border border-theme-border rounded-lg space-y-2 shadow-sm"
          >
            <input
              type="text"
              autoFocus
              placeholder={t('folders.addFolder') + '...'}
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSaveCreate();
                if (e.key === 'Escape') setIsCreating(false);
              }}
              className="w-full bg-theme-sidebar px-2 py-1 rounded text-xs outline-none border border-theme-border focus:border-theme-accent text-theme-text"
            />
            <div className="flex items-center justify-end space-x-1">
              <button
                type="button"
                onClick={() => setIsCreating(false)}
                className="p-1 text-theme-muted hover:text-theme-text rounded"
              >
                <X size={13} />
              </button>
              <button
                type="button"
                onClick={handleSaveCreate}
                disabled={!newFolderName.trim()}
                className="flex items-center space-x-1 px-2 py-0.5 rounded bg-theme-accent text-white text-xs font-semibold hover:bg-theme-accent-hover disabled:opacity-50"
              >
                <Check size={12} />
                <span>{t('note.save')}</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Folders & Notes list */}
      <div className="flex-1 overflow-y-auto px-2 py-2 space-y-2">
        {folders.length === 0 && !isCreating ? (
          <div className="text-center py-8 text-xs text-theme-muted">
            {t('folders.empty')}
          </div>
        ) : (
          folders.map((folder) => {
            const folderNotes = notes.filter((n) => n.folderId === folder.id);
            const visibleNotes = filterNotes(folderNotes);
            const isFolderSelected = selectedFolderId === folder.id;
            const isDragOverNotes = dragOverFolderNotesId === folder.id;

            return (
              <div key={folder.id} className="space-y-1">
                <FolderItemRow
                  folder={folder}
                  noteCount={folderNotes.length}
                  isSelected={isFolderSelected}
                  onSelectFolder={() => onSelectFolder(folder.id)}
                  onToggleExpand={() => onToggleFolderExpand(folder.id)}
                  onAddNote={() => onAddNote(folder.id)}
                  onUpdateFolder={onUpdateFolder}
                  onDeleteFolder={() => onDeleteFolder(folder.id)}
                  onMoveNoteToFolder={(noteId) => {
                    if (onReorderOrMoveNote) {
                      onReorderOrMoveNote(noteId, folder.id);
                    } else if (onMoveNoteToFolder) {
                      onMoveNoteToFolder(noteId, folder.id);
                    }
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

                        const noteId =
                          e.dataTransfer.getData('application/udo-note-id') ||
                          e.dataTransfer.getData('text/plain');
                        if (noteId && onReorderOrMoveNote) {
                          onReorderOrMoveNote(noteId, folder.id);
                        }
                      }}
                      className={`overflow-hidden pl-3 space-y-0.5 border-l ml-4 transition-colors rounded-r-lg ${
                        isDragOverNotes
                          ? 'border-theme-accent bg-theme-accent/10 ring-1 ring-theme-accent/30'
                          : 'border-theme-border/40'
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
                            onSelect={() => {
                              onSelectFolder(folder.id);
                              onSelectNote(note.id);
                            }}
                            onToggleComplete={() => onToggleNoteComplete(note.id)}
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
      </div>
    </div>
  );
};
