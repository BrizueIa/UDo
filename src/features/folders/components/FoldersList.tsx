import React from 'react';
import { FolderItem, NoteItem, SubjectItem, ViewFilter } from '../../../shared/types';
import { ChevronDown, ChevronRight, FolderPlus, Plus, CheckCircle2, Circle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';

interface Props {
  currentSubject?: SubjectItem;
  folders: FolderItem[];
  notes: NoteItem[];
  selectedNoteId: string;
  filter: ViewFilter;
  onSelectNote: (id: string) => void;
  onToggleNoteComplete: (id: string) => void;
  onToggleFolderExpand: (id: string) => void;
  onAddFolder: () => void;
  onAddNote: (folderId: string) => void;
}

export const FoldersList: React.FC<Props> = ({
  currentSubject,
  folders,
  notes,
  selectedNoteId,
  filter,
  onSelectNote,
  onToggleNoteComplete,
  onToggleFolderExpand,
  onAddFolder,
  onAddNote,
}) => {
  const { t } = useTranslation();

  // Filter notes according to the top filter pills: All, Pending, Completed
  const filterNotes = (folderNotes: NoteItem[]) => {
    return folderNotes.filter((n) => {
      if (filter === 'pending') return !n.isCompleted;
      if (filter === 'completed') return n.isCompleted;
      return true;
    });
  };

  return (
    <div className="w-72 flex-shrink-0 bg-theme-column border-r border-theme-border flex flex-col h-full select-none">
      {/* Header with active subject title and new folder button */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-theme-border/50">
        <h2 className="text-sm font-semibold text-theme-text truncate">
          {currentSubject?.name || t('nav.subjects')}
        </h2>
        <button
          onClick={onAddFolder}
          className="p-1 rounded-md text-theme-muted hover:text-theme-text hover:bg-theme-hover transition-colors"
          title={t('folders.addFolder')}
        >
          <FolderPlus size={16} />
        </button>
      </div>

      {/* Folders & Notes list */}
      <div className="flex-1 overflow-y-auto px-2 py-3 space-y-3">
        {folders.length === 0 ? (
          <div className="text-center py-8 text-xs text-theme-muted">
            {t('folders.empty')}
          </div>
        ) : (
          folders.map((folder) => {
            const folderNotes = notes.filter((n) => n.folderId === folder.id);
            const visibleNotes = filterNotes(folderNotes);

            return (
              <div key={folder.id} className="space-y-1">
                {/* Folder Row */}
                <div className="group flex items-center justify-between px-2 py-1.5 rounded-md hover:bg-theme-hover/50 text-theme-text">
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

                  <button
                    onClick={() => onAddNote(folder.id)}
                    className="opacity-0 group-hover:opacity-100 p-1 text-theme-muted hover:text-theme-text transition-opacity"
                    title={t('folders.addNote')}
                  >
                    <Plus size={14} />
                  </button>
                </div>

                {/* Notes in folder (Animated Accordion) */}
                <AnimatePresence initial={false}>
                  {folder.isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2, ease: 'easeInOut' }}
                      className="overflow-hidden pl-3 space-y-0.5 border-l border-theme-border/40 ml-4"
                    >
                      {visibleNotes.map((note) => {
                        const isSelected = note.id === selectedNoteId;

                        return (
                          <div
                            key={note.id}
                            onClick={() => onSelectNote(note.id)}
                            className={`group flex items-center justify-between px-2.5 py-1.5 rounded-lg cursor-pointer transition-all ${
                              isSelected
                                ? 'bg-theme-card text-theme-text border border-theme-accent/50 shadow-sm'
                                : 'text-theme-muted hover:text-theme-text hover:bg-theme-hover/40 border border-transparent'
                            }`}
                          >
                            <div className="flex items-center space-x-2 min-w-0 flex-1">
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
                          </div>
                        );
                      })}
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
