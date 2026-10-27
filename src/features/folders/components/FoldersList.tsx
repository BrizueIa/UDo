import React, { useState } from 'react';
import { FolderItem, NoteItem, SubjectItem, ViewFilter } from '../../../shared/types';
import {
  ChevronDown,
  ChevronRight,
  FolderPlus,
  Plus,
  CheckCircle2,
  Circle,
  Pencil,
  Trash2,
  Check,
  X,
  Pin,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';

interface Props {
  currentSubject?: SubjectItem;
  folders: FolderItem[];
  notes: NoteItem[];
  selectedNoteId: string;
  filter: ViewFilter;
  searchQuery?: string;
  onSelectNote: (id: string) => void;
  onToggleNoteComplete: (id: string) => void;
  onToggleFolderExpand: (id: string) => void;
  onAddFolder: (name: string) => void;
  onUpdateFolder: (folder: FolderItem) => void;
  onDeleteFolder: (id: string) => void;
  onAddNote: (folderId: string) => void;
}

export const FoldersList: React.FC<Props> = ({
  currentSubject,
  folders,
  notes,
  selectedNoteId,
  filter,
  searchQuery = '',
  onSelectNote,
  onToggleNoteComplete,
  onToggleFolderExpand,
  onAddFolder,
  onUpdateFolder,
  onDeleteFolder,
  onAddNote,
}) => {
  const { t } = useTranslation();

  // Create folder inline state
  const [isCreating, setIsCreating] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');

  // Edit folder inline state
  const [editingFolderId, setEditingFolderId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');

  // Delete folder confirmation state
  const [deletingFolderId, setDeletingFolderId] = useState<string | null>(null);

  // Filter notes according to the top filter pills & search query
  const filterNotes = (folderNotes: NoteItem[]) => {
    const query = searchQuery.trim().toLowerCase();
    return folderNotes
      .filter((n) => {
        // Status pill filter
        if (filter === 'pending' && n.isCompleted) return false;
        if (filter === 'completed' && !n.isCompleted) return false;

        // Scoped search query filter
        if (query) {
          const matchTitle = n.title.toLowerCase().includes(query);
          const matchContent = n.content.toLowerCase().includes(query);
          const matchTags = n.tags.some((t) => t.toLowerCase().includes(query));
          if (!matchTitle && !matchContent && !matchTags) return false;
        }

        return true;
      })
      .sort((a, b) => Number(b.isPinned) - Number(a.isPinned));
  };

  const handleStartCreate = () => {
    setIsCreating(true);
    setNewFolderName('');
    setEditingFolderId(null);
  };

  const handleSaveCreate = () => {
    const trimmed = newFolderName.trim();
    if (trimmed) {
      onAddFolder(trimmed);
    }
    setIsCreating(false);
    setNewFolderName('');
  };

  const handleStartEdit = (folder: FolderItem, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingFolderId(folder.id);
    setEditingName(folder.name);
    setIsCreating(false);
  };

  const handleSaveEdit = (folder: FolderItem, e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = editingName.trim();
    if (trimmed) {
      onUpdateFolder({
        ...folder,
        name: trimmed,
      });
    }
    setEditingFolderId(null);
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onDeleteFolder(id);
    setDeletingFolderId(null);
  };

  return (
    <div className="w-72 flex-shrink-0 bg-theme-column border-r border-theme-border flex flex-col h-full select-none">
      {/* Header with active subject title and new folder button */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-theme-border/50">
        <h2 className="text-sm font-semibold text-theme-text truncate">
          {currentSubject?.name || t('nav.subjects')}
        </h2>
        <button
          onClick={handleStartCreate}
          className="p-1 rounded-md text-theme-muted hover:text-theme-text hover:bg-theme-hover transition-colors"
          title={t('folders.addFolder')}
        >
          <FolderPlus size={16} />
        </button>
      </div>

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
                <span>Save</span>
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
            const isEditing = editingFolderId === folder.id;

            return (
              <div key={folder.id} className="space-y-1">
                {/* Folder Row */}
                {isEditing ? (
                  <div className="flex items-center space-x-1 px-2 py-1 rounded bg-theme-card border border-theme-accent/50">
                    <input
                      type="text"
                      autoFocus
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSaveEdit(folder);
                        if (e.key === 'Escape') setEditingFolderId(null);
                      }}
                      className="flex-1 bg-transparent text-xs text-theme-text outline-none px-1"
                    />
                    <button
                      onClick={() => setEditingFolderId(null)}
                      className="p-0.5 text-theme-muted hover:text-theme-text"
                    >
                      <X size={12} />
                    </button>
                    <button
                      onClick={() => handleSaveEdit(folder)}
                      className="p-0.5 text-theme-accent hover:text-theme-accent-hover"
                    >
                      <Check size={12} />
                    </button>
                  </div>
                ) : (
                  <div className="group flex items-center justify-between px-2 py-1.5 rounded-md hover:bg-theme-hover/50 text-theme-text transition-colors">
                    <button
                      onClick={() => onToggleFolderExpand(folder.id)}
                      className="flex items-center space-x-1.5 flex-1 min-w-0 text-left"
                    >
                      <span className="text-theme-muted">
                        {folder.isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                      </span>
                      <span className="text-xs font-semibold text-theme-text truncate">
                        📁 {folder.name}
                      </span>
                      <span className="text-[11px] text-theme-muted font-mono">
                        ({folderNotes.length})
                      </span>
                    </button>

                    {/* Folder Actions (visible on hover) */}
                    <div className="opacity-0 group-hover:opacity-100 flex items-center space-x-0.5 transition-opacity">
                      <button
                        onClick={() => onAddNote(folder.id)}
                        className="p-1 text-theme-muted hover:text-theme-text rounded"
                        title={t('folders.addNote')}
                      >
                        <Plus size={13} />
                      </button>
                      <button
                        onClick={(e) => handleStartEdit(folder, e)}
                        className="p-1 text-theme-muted hover:text-theme-text rounded"
                        title={t('folders.renameFolder')}
                      >
                        <Pencil size={12} />
                      </button>

                      {deletingFolderId === folder.id ? (
                        <div className="flex items-center space-x-0.5 bg-red-500/10 px-1 py-0.5 rounded border border-red-500/30">
                          <button
                            onClick={(e) => handleDelete(folder.id, e)}
                            className="text-[10px] text-red-400 font-bold px-1 hover:underline"
                            title={t('folders.deleteFolderConfirm')}
                          >
                            Del
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeletingFolderId(null);
                            }}
                            className="text-theme-muted hover:text-theme-text p-0.5"
                          >
                            <X size={10} />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeletingFolderId(folder.id);
                          }}
                          className="p-1 text-theme-muted hover:text-red-400 rounded"
                          title={t('folders.deleteFolder')}
                        >
                          <Trash2 size={12} />
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* Notes in folder (Animated Accordion) */}
                <AnimatePresence initial={false}>
                  {folder.isExpanded && (
                    <motion.div
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      transition={{ duration: 0.15, ease: 'easeOut' }}
                      className="overflow-hidden pl-3 space-y-0.5 border-l border-theme-border/40 ml-4"
                    >
                      {visibleNotes.length === 0 ? (
                        <div className="text-[11px] text-theme-muted/60 py-1 pl-1">
                          {t('folders.noNotes')}
                        </div>
                      ) : (
                        visibleNotes.map((note) => {
                          const isSelected = note.id === selectedNoteId;

                          return (
                            <motion.div
                              key={note.id}
                              onClick={() => onSelectNote(note.id)}
                              whileHover={{ x: 2 }}
                              whileTap={{ scale: 0.98 }}
                              className={`group relative flex items-center justify-between px-2.5 py-1.5 rounded-lg cursor-pointer transition-colors select-none ${
                                isSelected
                                  ? 'text-theme-text font-medium'
                                  : 'text-theme-muted hover:text-theme-text hover:bg-theme-hover/40'
                              }`}
                            >
                              {/* Sliding Active Pill */}
                              {isSelected && (
                                <motion.div
                                  layoutId="active-note-pill"
                                  className="absolute inset-0 bg-theme-card border border-theme-accent/50 rounded-lg shadow-sm"
                                  transition={{ type: 'spring', stiffness: 450, damping: 32 }}
                                />
                              )}

                              <div className="relative z-10 flex items-center space-x-2 min-w-0 flex-1">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onToggleNoteComplete(note.id);
                                  }}
                                  className="flex-shrink-0 text-theme-muted hover:text-theme-accent transition-colors"
                                >
                                  {note.isCompleted ? (
                                    <CheckCircle2 size={15} className="text-emerald-500" />
                                  ) : (
                                    <Circle size={15} className="hover:stroke-theme-accent" />
                                  )}
                                </button>

                                <span
                                  className={`text-[13px] truncate ${
                                    note.isCompleted
                                      ? 'line-through text-theme-muted/60 opacity-80'
                                      : 'text-theme-text'
                                  }`}
                                >
                                  {note.title || t('note.titlePlaceholder')}
                                </span>
                              </div>

                              {/* Pinned Note Badge */}
                              {note.isPinned && (
                                <span className="relative z-10">
                                  <Pin size={11} className="text-amber-400 rotate-45 flex-shrink-0 ml-1 fill-amber-400/30" />
                                </span>
                              )}
                            </motion.div>
                          );
                        })
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
