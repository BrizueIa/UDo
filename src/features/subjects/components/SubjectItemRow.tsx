import React, { useState, useRef } from 'react';
import { SubjectItem, FolderItem } from '../../../shared/types';
import { Pencil, Trash2, X, Check, Folder } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { renderRichTitle } from '../../note-sheet/utils/inlineRichTextParser';
import { RichTextToolbar } from '../../note-sheet/components/RichTextToolbar';
import { useRichTextSelection } from '../../note-sheet/hooks/useRichTextSelection';

const COLOR_PALETTE = [
  '#5551f5', '#1fd4a5', '#a986ff', '#ffc95f',
  '#f97316', '#10b981', '#ec4899', '#3b82f6',
];

interface Props {
  subject: SubjectItem;
  isSelected: boolean;
  count: number;
  folders: FolderItem[];
  hasActiveNote?: boolean;
  onSelectSubject: (id: string) => void;
  onUpdateSubject: (subject: SubjectItem) => void;
  onDeleteSubject: (id: string) => void;
  onMoveNoteToFolder?: (noteId: string, folderId: string) => void;
  onMoveNoteToSubject?: (noteId: string, subjectId: string) => void;
  onMoveFolderToSubject?: (folderId: string, subjectId: string) => void;
}

export const SubjectItemRow: React.FC<Props> = ({
  subject,
  isSelected,
  count,
  folders,
  hasActiveNote = false,
  onSelectSubject,
  onUpdateSubject,
  onDeleteSubject,
  onMoveNoteToFolder,
  onMoveNoteToSubject,
  onMoveFolderToSubject,
}) => {
  const { t } = useTranslation();
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(subject.name);
  const [editColor, setEditColor] = useState(subject.color);
  const [isDeleting, setIsDeleting] = useState(false);
  const {
    inputRef,
    coords,
    handleMouseUp,
    handleKeyUp,
    closeToolbar,
  } = useRichTextSelection<HTMLInputElement>();

  const [isDragOver, setIsDragOver] = useState(false);
  const [showFolderSubmenu, setShowFolderSubmenu] = useState(false);
  const [dragOverFolderId, setDragOverFolderId] = useState<string | null>(null);
  const hoverTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const subjectFolders = folders.filter((f) => f.subjectId === subject.id);

  const handleDragOver = (e: React.DragEvent) => {
    if (
      e.dataTransfer.types.includes('application/udo-note-id') ||
      e.dataTransfer.types.includes('application/udo-folder-id') ||
      e.dataTransfer.types.includes('text/plain')
    ) {
      e.preventDefault();
      e.stopPropagation();
      e.dataTransfer.dropEffect = 'move';
      if (!isDragOver) setIsDragOver(true);

      const hasNote = e.dataTransfer.types.includes('application/udo-note-id') || e.dataTransfer.types.includes('text/plain');
      if (hasNote && !showFolderSubmenu) {
        setShowFolderSubmenu(true);
        if (!hoverTimerRef.current) {
          hoverTimerRef.current = setTimeout(() => {
            onSelectSubject(subject.id);
          }, 250);
        }
      }
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDragOver(false);
      setShowFolderSubmenu(false);
      setDragOverFolderId(null);
      if (hoverTimerRef.current) {
        clearTimeout(hoverTimerRef.current);
        hoverTimerRef.current = null;
      }
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    setShowFolderSubmenu(false);
    setDragOverFolderId(null);
    if (hoverTimerRef.current) {
      clearTimeout(hoverTimerRef.current);
      hoverTimerRef.current = null;
    }

    const folderId = e.dataTransfer.getData('application/udo-folder-id');
    const noteId =
      e.dataTransfer.getData('application/udo-note-id') ||
      (!folderId ? e.dataTransfer.getData('text/plain') : '');

    if (folderId && onMoveFolderToSubject) {
      setTimeout(() => {
        onMoveFolderToSubject(folderId, subject.id);
      }, 0);
    } else if (noteId && onMoveNoteToSubject) {
      setTimeout(() => {
        onMoveNoteToSubject(noteId, subject.id);
      }, 0);
    }
  };

  const handleSaveEdit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = editName.trim();
    if (trimmed) onUpdateSubject({ ...subject, name: trimmed, color: editColor });
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <div className="relative p-2.5 bg-theme-card border border-theme-accent/40 rounded-xl space-y-2 shadow-sm">
        <input
          ref={inputRef}
          type="text"
          autoFocus
          value={editName}
          onChange={(e) => setEditName(e.target.value)}
          onMouseUp={handleMouseUp}
          onKeyUp={handleKeyUp}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              closeToolbar();
              handleSaveEdit();
            }
            if (e.key === 'Escape') {
              closeToolbar();
              setIsEditing(false);
            }
          }}
          className="w-full bg-theme-column px-2 py-1 rounded text-xs outline-none border border-theme-border text-theme-text"
        />
        <div className="flex items-center justify-between px-1">
          {COLOR_PALETTE.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setEditColor(c)}
              className={`w-4 h-4 rounded-[4px] transition-transform ${
                editColor === c ? 'scale-125 ring-2 ring-white/60' : 'opacity-80 hover:opacity-100'
              }`}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
        <div className="flex items-center justify-end space-x-1 pt-1">
          <button
            onClick={() => {
              closeToolbar();
              setIsEditing(false);
            }}
            className="p-1 rounded text-theme-muted hover:text-theme-text"
          >
            <X size={13} />
          </button>
          <button
            onClick={() => {
              closeToolbar();
              handleSaveEdit();
            }}
            className="p-1 rounded bg-theme-accent text-white hover:bg-theme-accent-hover"
          >
            <Check size={13} />
          </button>
        </div>
        <RichTextToolbar
          inputRef={inputRef}
          content={editName}
          coords={coords}
          onChangeContent={(newName) => setEditName(newName)}
          onClose={closeToolbar}
        />
      </div>
    );
  }

  return (
    <div className="space-y-1">
      <motion.div
        onClick={() => onSelectSubject(subject.id)}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        whileHover={{ x: 2 }}
        whileTap={{ scale: 0.98 }}
        className={`group relative w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer select-none border ${
          isDragOver
            ? 'bg-theme-accent/25 ring-2 ring-theme-accent/70 border-theme-accent scale-[1.02] shadow-md text-theme-text font-bold'
            : isSelected
            ? 'bg-theme-card border-theme-accent/40 shadow-sm text-theme-text font-semibold'
            : 'text-theme-muted hover:text-theme-text hover:bg-theme-hover/40 border-transparent'
        }`}
      >
        <div className="relative z-10 flex items-center space-x-2.5 min-w-0 flex-1">
          <span
            className="w-2.5 h-2.5 rounded-[3.5px] flex-shrink-0 shadow-sm transition-transform group-hover:scale-110"
            style={{ backgroundColor: subject.color }}
          />
          <span className="truncate text-[13px]">
            {renderRichTitle(subject.name, 'subj', 0, { ignoreSize: true })}
          </span>
        </div>

        <div className="relative z-10 flex items-center space-x-1 flex-shrink-0">
          <div className="opacity-0 group-hover:opacity-100 flex items-center space-x-0.5 transition-opacity">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsEditing(true);
                setEditName(subject.name);
                setEditColor(subject.color);
              }}
              className="p-1 text-theme-muted hover:text-theme-text hover:bg-theme-hover rounded"
              title={t('nav.editSubject')}
            >
              <Pencil size={12} />
            </button>
            {isDeleting ? (
              <div className="flex items-center space-x-0.5 bg-red-500/10 px-1 py-0.5 rounded border border-red-500/30">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteSubject(subject.id);
                    setIsDeleting(false);
                  }}
                  className="text-[10px] text-red-400 font-bold px-1 hover:underline"
                  title={t('nav.confirmDelete')}
                >
                  {t('nav.del')}
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsDeleting(false);
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
                  setIsDeleting(true);
                }}
                className="p-1 text-theme-muted hover:text-red-400 hover:bg-theme-hover rounded"
                title={t('nav.deleteSubject')}
              >
                <Trash2 size={12} />
              </button>
            )}
          </div>

          {hasActiveNote && (
            <span
              className="w-2 h-2 rounded-full bg-theme-accent shadow-[0_0_8px_var(--color-accent)] ring-1 ring-theme-accent/30 shrink-0"
              title={t('nav.activeNoteProject')}
            />
          )}

          {count > 0 && !isDeleting && (
            <span
              className={`text-xs px-2 py-0.5 rounded-md font-mono text-[11px] group-hover:hidden ${
                isSelected
                  ? 'bg-theme-accent/20 text-theme-accent font-semibold'
                  : 'bg-theme-card/70 text-theme-muted'
              }`}
            >
              {count}
            </span>
          )}
        </div>
      </motion.div>

      {/* Target Folder Submenu during Note Drag */}
      <AnimatePresence>
        {showFolderSubmenu && subjectFolders.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="pl-5 pr-1 space-y-1 overflow-hidden"
          >
            {subjectFolders.map((f) => {
              const isOverFolder = dragOverFolderId === f.id;
              return (
                <div
                  key={f.id}
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    e.dataTransfer.dropEffect = 'move';
                    if (dragOverFolderId !== f.id) setDragOverFolderId(f.id);
                  }}
                  onDragLeave={(e) => {
                    e.preventDefault();
                    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                      setDragOverFolderId(null);
                    }
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const noteId =
                      e.dataTransfer.getData('application/udo-note-id') ||
                      e.dataTransfer.getData('text/plain');
                    if (noteId && onMoveNoteToFolder) {
                      setTimeout(() => {
                        onMoveNoteToFolder(noteId, f.id);
                      }, 0);
                    }
                    setShowFolderSubmenu(false);
                    setDragOverFolderId(null);
                  }}
                  className={`flex items-center space-x-1.5 px-2 py-1 rounded-md text-xs transition-all cursor-pointer ${
                    isOverFolder
                      ? 'bg-theme-accent text-white font-bold scale-[1.02] shadow-sm'
                      : 'bg-theme-card/60 hover:bg-theme-hover text-theme-muted hover:text-theme-text border border-theme-border/40'
                  }`}
                >
                  <Folder size={12} className={isOverFolder ? 'text-white' : 'text-amber-400 fill-amber-400/20'} />
                  <span className="truncate">{renderRichTitle(f.name)}</span>
                </div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
