import React, { useState } from 'react';
import {
  ChevronDown,
  ChevronRight,
  Plus,
  Pencil,
  Trash2,
  Check,
  X,
  Folder,
  FolderOpen,
} from 'lucide-react';
import { FolderItem } from '../../../shared/types';
import { useTranslation } from 'react-i18next';
import { renderRichTitle } from '../../note-sheet/utils/inlineRichTextParser';
import { RichTextToolbar } from '../../note-sheet/components/RichTextToolbar';
import { useRichTextSelection } from '../../note-sheet/hooks/useRichTextSelection';

interface Props {
  folder: FolderItem;
  noteCount: number;
  isSelected?: boolean;
  onSelectFolder?: () => void;
  onToggleExpand: () => void;
  onAddNote: () => void;
  onUpdateFolder: (folder: FolderItem) => void;
  onDeleteFolder: () => void;
  onMoveNoteToFolder?: (noteId: string, folderId: string) => void;
  onReorderFolder?: (draggedFolderId: string, targetFolderId: string, position: 'before' | 'after') => void;
}

export const FolderItemRow: React.FC<Props> = ({
  folder,
  noteCount,
  isSelected = false,
  onSelectFolder,
  onToggleExpand,
  onAddNote,
  onUpdateFolder,
  onDeleteFolder,
  onMoveNoteToFolder,
  onReorderFolder,
}) => {
  const { t } = useTranslation();
  const [isEditing, setIsEditing] = useState(false);
  const [editingName, setEditingName] = useState(folder.name);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDragOverNote, setIsDragOverNote] = useState(false);
  const [dropPosition, setDropPosition] = useState<'before' | 'after' | null>(null);
  const {
    inputRef,
    coords,
    handleMouseUp,
    handleKeyUp,
    closeToolbar,
  } = useRichTextSelection<HTMLInputElement>();

  const handleDragOver = (e: React.DragEvent) => {
    const isFolder = e.dataTransfer.types.includes('application/udo-folder-id');
    const isNote = e.dataTransfer.types.includes('application/udo-note-id');

    if (isFolder) {
      e.preventDefault();
      e.stopPropagation();
      e.dataTransfer.dropEffect = 'move';
      setIsDragOverNote(false);

      const rect = e.currentTarget.getBoundingClientRect();
      const midPoint = rect.top + rect.height / 2;
      const pos = e.clientY < midPoint ? 'before' : 'after';
      if (pos !== dropPosition) {
        setDropPosition(pos);
      }
    } else if (isNote || e.dataTransfer.types.includes('text/plain')) {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      setDropPosition(null);
      setIsDragOverNote(true);
    }
  };

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('application/udo-folder-id', folder.id);
    e.dataTransfer.setData('text/plain', folder.id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOverNote(false);
    setDropPosition(null);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOverNote(false);
    const pos = dropPosition || 'after';
    setDropPosition(null);

    const draggedFolderId = e.dataTransfer.getData('application/udo-folder-id');
    if (draggedFolderId) {
      if (draggedFolderId !== folder.id && onReorderFolder) {
        setTimeout(() => {
          onReorderFolder(draggedFolderId, folder.id, pos);
        }, 0);
      }
      return;
    }

    const noteId = e.dataTransfer.getData('application/udo-note-id') || e.dataTransfer.getData('text/plain');
    if (noteId && onMoveNoteToFolder) {
      setTimeout(() => {
        onMoveNoteToFolder(noteId, folder.id);
      }, 0);
    }
  };

  const handleSaveEdit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = editingName.trim();
    if (trimmed) {
      onUpdateFolder({
        ...folder,
        name: trimmed,
      });
    }
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <div className="relative flex items-center space-x-1 px-2 py-1 rounded bg-theme-card border border-theme-accent/50">
        <input
          ref={inputRef}
          type="text"
          autoFocus
          value={editingName}
          onChange={(e) => setEditingName(e.target.value)}
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
          className="flex-1 bg-transparent text-xs text-theme-text outline-none px-1"
        />
        <button
          onClick={() => {
            closeToolbar();
            setIsEditing(false);
          }}
          className="p-0.5 text-theme-muted hover:text-theme-text"
        >
          <X size={12} />
        </button>
        <button
          onClick={() => {
            closeToolbar();
            handleSaveEdit();
          }}
          className="p-0.5 text-theme-accent hover:text-theme-accent-hover"
        >
          <Check size={12} />
        </button>
        <RichTextToolbar
          inputRef={inputRef}
          content={editingName}
          coords={coords}
          onChangeContent={(newName) => setEditingName(newName)}
          onClose={closeToolbar}
        />
      </div>
    );
  }

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onClick={onSelectFolder}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`group relative flex items-center justify-between px-2 py-1.5 rounded-md cursor-grab active:cursor-grabbing hover:translate-x-0.5 transition-all select-none border ${
        isDragOverNote
          ? 'bg-theme-accent/25 border-theme-accent ring-2 ring-theme-accent/60 scale-[1.01] shadow-md'
          : isSelected
          ? 'bg-theme-card border-theme-accent/50 text-theme-text font-semibold shadow-xs'
          : 'hover:bg-theme-hover/50 text-theme-text border-transparent'
      }`}
    >
      {/* Drop position indicator lines for folder reordering */}
      {dropPosition === 'before' && (
        <div className="absolute top-0 left-1 right-1 h-0.5 bg-theme-accent rounded-full z-30 shadow-xs" />
      )}
      {dropPosition === 'after' && (
        <div className="absolute bottom-0 left-1 right-1 h-0.5 bg-theme-accent rounded-full z-30 shadow-xs" />
      )}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onSelectFolder?.();
          onToggleExpand();
        }}
        className="flex items-center space-x-1.5 flex-1 min-w-0 text-left"
      >
        <span className="text-theme-muted">
          {folder.isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </span>
        <span className="flex items-center space-x-1.5 min-w-0 truncate">
          {folder.isExpanded ? (
            <FolderOpen size={14} className="text-amber-400 fill-amber-400/25 shrink-0" />
          ) : (
            <Folder size={14} className="text-amber-400 fill-amber-400/20 shrink-0" />
          )}
          <span className="text-xs font-semibold text-theme-text truncate">
            {renderRichTitle(folder.name)}
          </span>
        </span>
        <span className="text-[11px] text-theme-muted font-mono ml-1">
          ({noteCount})
        </span>
      </button>

      {/* Folder Actions (visible on hover or when selected) */}
      <div
        onClick={(e) => e.stopPropagation()}
        className={`flex items-center space-x-0.5 transition-opacity ${
          isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
        }`}
      >
        <button
          onClick={onAddNote}
          className="p-1 text-theme-muted hover:text-theme-accent rounded"
          title={`${t('folders.addNote')} (Ctrl+N)`}
        >
          <Plus size={13} />
        </button>
        <button
          onClick={() => {
            setIsEditing(true);
            setEditingName(folder.name);
          }}
          className="p-1 text-theme-muted hover:text-theme-text rounded"
          title={t('folders.renameFolder')}
        >
          <Pencil size={12} />
        </button>

        {isDeleting ? (
          <div className="flex items-center space-x-0.5 bg-red-500/10 px-1 py-0.5 rounded border border-red-500/30">
            <button
              onClick={() => {
                onDeleteFolder();
                setIsDeleting(false);
              }}
              className="text-[10px] text-red-400 font-bold px-1 hover:underline"
              title={t('folders.deleteFolderConfirm')}
            >
              Del
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
            className="p-1 text-theme-muted hover:text-red-400 rounded"
            title={t('folders.deleteFolder')}
          >
            <Trash2 size={12} />
          </button>
        )}
      </div>
    </div>
  );
};
