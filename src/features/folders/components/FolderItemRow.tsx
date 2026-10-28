import React, { useState } from 'react';
import {
  ChevronDown,
  ChevronRight,
  Plus,
  Pencil,
  Trash2,
  Check,
  X,
} from 'lucide-react';
import { FolderItem } from '../../../shared/types';
import { useTranslation } from 'react-i18next';

interface Props {
  folder: FolderItem;
  noteCount: number;
  isSelected?: boolean;
  onSelectFolder?: () => void;
  onToggleExpand: () => void;
  onAddNote: () => void;
  onUpdateFolder: (folder: FolderItem) => void;
  onDeleteFolder: () => void;
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
}) => {
  const { t } = useTranslation();
  const [isEditing, setIsEditing] = useState(false);
  const [editingName, setEditingName] = useState(folder.name);
  const [isDeleting, setIsDeleting] = useState(false);

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
      <div className="flex items-center space-x-1 px-2 py-1 rounded bg-theme-card border border-theme-accent/50">
        <input
          type="text"
          autoFocus
          value={editingName}
          onChange={(e) => setEditingName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSaveEdit();
            if (e.key === 'Escape') setIsEditing(false);
          }}
          className="flex-1 bg-transparent text-xs text-theme-text outline-none px-1"
        />
        <button
          onClick={() => setIsEditing(false)}
          className="p-0.5 text-theme-muted hover:text-theme-text"
        >
          <X size={12} />
        </button>
        <button
          onClick={() => handleSaveEdit()}
          className="p-0.5 text-theme-accent hover:text-theme-accent-hover"
        >
          <Check size={12} />
        </button>
      </div>
    );
  }

  return (
    <div
      onClick={onSelectFolder}
      className={`group flex items-center justify-between px-2 py-1.5 rounded-md cursor-pointer transition-colors ${
        isSelected
          ? 'bg-theme-card border border-theme-accent/50 text-theme-text font-semibold shadow-xs'
          : 'hover:bg-theme-hover/50 text-theme-text border border-transparent'
      }`}
    >
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
        <span className="text-xs font-semibold text-theme-text truncate">
          📁 {folder.name}
        </span>
        <span className="text-[11px] text-theme-muted font-mono">
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
