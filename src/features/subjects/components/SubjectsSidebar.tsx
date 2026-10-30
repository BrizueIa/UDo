import React, { useState, useRef } from 'react';
import { SubjectItem, FolderItem } from '../../../shared/types';
import { Plus, Check, X, FolderPlus, Lock, Unlock, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { SubjectItemRow } from './SubjectItemRow';
import { useContextMenu } from '../../../shared/ui/context-menu';

const COLOR_PALETTE = [
  '#5551f5', '#1fd4a5', '#a986ff', '#ffc95f',
  '#f97316', '#10b981', '#ec4899', '#3b82f6',
];

interface Props {
  subjects: SubjectItem[];
  folders: FolderItem[];
  selectedSubjectId: string;
  activeNoteSubjectId?: string;
  secondaryNoteSubjectId?: string;
  isFocused?: boolean;
  isVaultUnlocked?: boolean;
  onToggleVault?: () => void;
  onOpenTrash?: () => void;
  onToggleSubjectPrivate?: (subject: SubjectItem) => void;
  onAddFolderToSubject?: (subjectId: string) => void;
  onSelectSubject: (id: string) => void;
  onAddSubject: (name: string, color: string) => void;
  onUpdateSubject: (subject: SubjectItem) => void;
  onDeleteSubject: (id: string) => void;
  getSubjectNoteCount: (id: string) => number;
  onMoveNoteToFolder?: (noteId: string, folderId: string) => void;
  onMoveNoteToSubject?: (noteId: string, subjectId: string) => void;
  onBatchMoveNotesToSubject?: (noteIds: string[], subjectId: string) => void;
  onMoveFolderToSubject?: (folderId: string, subjectId: string) => void;
  onConvertFolderToSubject?: (folderId: string) => void;
  onFocusColumn?: () => void;
}

export const SubjectsSidebar: React.FC<Props> = ({
  subjects,
  folders,
  selectedSubjectId,
  activeNoteSubjectId,
  secondaryNoteSubjectId,
  isFocused = false,
  isVaultUnlocked = false,
  onToggleVault,
  onOpenTrash,
  onToggleSubjectPrivate,
  onAddFolderToSubject,
  onSelectSubject,
  onAddSubject,
  onUpdateSubject,
  onDeleteSubject,
  getSubjectNoteCount,
  onMoveNoteToFolder,
  onMoveNoteToSubject,
  onBatchMoveNotesToSubject,
  onMoveFolderToSubject,
  onConvertFolderToSubject,
  onFocusColumn,
}) => {
  const { t } = useTranslation();
  const { openContextMenu } = useContextMenu();

  const handleSubjectContextMenu = (e: React.MouseEvent, subject: SubjectItem) => {
    openContextMenu(e, [
      {
        id: 'new-folder',
        label: t('folders.addFolder'),
        icon: <FolderPlus size={14} />,
        onClick: () => onAddFolderToSubject?.(subject.id),
      },
      {
        id: 'toggle-private',
        label: subject.isPrivate ? t('vault.removeFromVault') || 'Quitar de Bóveda' : t('vault.moveToVault') || 'Mover a Bóveda Privada',
        icon: subject.isPrivate ? <Unlock size={14} /> : <Lock size={14} />,
        onClick: () => onToggleSubjectPrivate?.(subject),
      },
      { id: 'sep-1', label: '', separator: true },
      {
        id: 'delete-subject',
        label: t('nav.deleteSubject'),
        icon: <Trash2 size={14} />,
        danger: true,
        onClick: () => onDeleteSubject(subject.id),
      },
    ]);
  };

  const publicSubjects = subjects.filter((s) => !s.isPrivate);
  const privateSubjects = subjects.filter((s) => s.isPrivate);

  // Drag and drop state for folders -> project conversion
  const [isDraggingFolder, setIsDraggingFolder] = useState(false);
  const [isDropOverEmptySpace, setIsDropOverEmptySpace] = useState(false);
  const dragLeaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // New Subject State
  const [isCreating, setIsCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [newColor, setNewColor] = useState(COLOR_PALETTE[0]);

  const handleStartCreate = () => {
    setIsCreating(true);
    setNewName('');
    const randomColor = COLOR_PALETTE[subjects.length % COLOR_PALETTE.length];
    setNewColor(randomColor);
  };

  const handleSaveCreate = () => {
    const trimmed = newName.trim();
    if (trimmed) onAddSubject(trimmed, newColor);
    setIsCreating(false);
    setNewName('');
  };

  const handleAsideDragOver = (e: React.DragEvent) => {
    if (
      e.dataTransfer.types.includes('application/udo-folder-id') ||
      e.dataTransfer.types.includes('text/plain')
    ) {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      if (dragLeaveTimerRef.current) {
        clearTimeout(dragLeaveTimerRef.current);
        dragLeaveTimerRef.current = null;
      }
      setIsDraggingFolder(true);
      setIsDropOverEmptySpace(true);
    }
  };

  const handleAsideDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      dragLeaveTimerRef.current = setTimeout(() => {
        setIsDraggingFolder(false);
        setIsDropOverEmptySpace(false);
      }, 100);
    }
  };

  const handleAsideDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingFolder(false);
    setIsDropOverEmptySpace(false);
    if (dragLeaveTimerRef.current) {
      clearTimeout(dragLeaveTimerRef.current);
      dragLeaveTimerRef.current = null;
    }

    const folderId = e.dataTransfer.getData('application/udo-folder-id');
    if (folderId && onConvertFolderToSubject) {
      setTimeout(() => {
        onConvertFolderToSubject(folderId);
      }, 0);
    }
  };

  return (
    <aside
      onClick={() => onFocusColumn?.()}
      onDragOver={handleAsideDragOver}
      onDragLeave={handleAsideDragLeave}
      onDrop={handleAsideDrop}
      className={`relative w-44 lg:w-56 flex-shrink-0 bg-theme-sidebar border-r border-theme-border flex flex-col h-full select-none transition-all ${
        isFocused ? 'ring-1 ring-inset ring-theme-accent/40 shadow-sm' : ''
      } ${isDropOverEmptySpace ? 'bg-theme-accent/5' : ''}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-3 border-b border-white/[0.06]">
        <span className="text-xs font-semibold tracking-wider text-theme-muted uppercase truncate">
          {t('nav.subjects')}
        </span>
        <div className="flex items-center space-x-1 shrink-0">
          {onToggleVault && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onToggleVault();
              }}
              className={`p-1 rounded-md transition-colors ${
                isVaultUnlocked
                  ? 'text-theme-accent hover:bg-theme-accent/15'
                  : 'text-theme-muted hover:text-theme-text hover:bg-theme-hover'
              }`}
              title={`${isVaultUnlocked ? t('vault.unlocked') : t('vault.locked')} (Ctrl+L)`}
            >
              {isVaultUnlocked ? <Unlock size={14} /> : <Lock size={14} />}
            </button>
          )}
          <button
            onClick={handleStartCreate}
            className="p-1 rounded-md text-theme-muted hover:text-theme-text hover:bg-theme-hover transition-colors"
            title={t('nav.addSubject')}
          >
            <Plus size={15} />
          </button>
        </div>
      </div>

      {/* Creation Form */}
      <AnimatePresence>
        {isCreating && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.12, ease: 'easeOut' }}
            className="p-3 mx-2 my-2 bg-theme-card border border-theme-border rounded-xl space-y-2.5 shadow-md"
          >
            <input
              type="text"
              autoFocus
              placeholder={t('nav.addSubject') + '...'}
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSaveCreate();
                if (e.key === 'Escape') setIsCreating(false);
              }}
              className="w-full bg-theme-column px-2.5 py-1.5 rounded-lg text-xs outline-none border border-theme-border focus:border-theme-accent text-theme-text placeholder-theme-muted"
            />

            {/* Color Palette Selector */}
            <div className="flex items-center justify-between px-1">
              {COLOR_PALETTE.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setNewColor(c)}
                  className={`w-4 h-4 rounded-[4px] transition-transform ${
                    newColor === c ? 'scale-125 ring-2 ring-white/60 shadow-sm' : 'opacity-80 hover:opacity-100'
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>

            <div className="flex items-center justify-end space-x-1.5 pt-1">
              <button
                type="button"
                onClick={() => setIsCreating(false)}
                className="p-1 rounded text-theme-muted hover:text-theme-text hover:bg-theme-hover transition-colors"
                title={t('nav.cancel')}
              >
                <X size={14} />
              </button>
              <button
                type="button"
                onClick={handleSaveCreate}
                disabled={!newName.trim()}
                className="flex items-center space-x-1 px-2.5 py-1 rounded bg-theme-accent text-white text-xs font-semibold hover:bg-theme-accent-hover transition-colors disabled:opacity-50"
              >
                <Check size={12} />
                <span>{t('nav.save')}</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Subjects List */}
      <div className="flex-1 overflow-y-auto px-2 py-2 space-y-1">
        {publicSubjects.map((subject) => (
          <SubjectItemRow
            key={subject.id}
            subject={subject}
            isSelected={subject.id === selectedSubjectId}
            hasActiveNote={subject.id === activeNoteSubjectId || subject.id === secondaryNoteSubjectId}
            count={getSubjectNoteCount(subject.id)}
            folders={folders}
            onSelectSubject={onSelectSubject}
            onUpdateSubject={onUpdateSubject}
            onDeleteSubject={onDeleteSubject}
            onMoveNoteToFolder={onMoveNoteToFolder}
            onMoveNoteToSubject={onMoveNoteToSubject}
            onBatchMoveNotesToSubject={onBatchMoveNotesToSubject}
            onMoveFolderToSubject={onMoveFolderToSubject}
            onContextMenu={(e) => handleSubjectContextMenu(e, subject)}
          />
        ))}

        {/* Private Vault Section (only visible when unlocked) */}
        {isVaultUnlocked && privateSubjects.length > 0 && (
          <div className="pt-2">
            <div className="flex items-center justify-between px-2.5 py-1 text-[10px] font-bold text-theme-accent uppercase tracking-wider">
              <span className="flex items-center space-x-1.5">
                <Lock size={11} />
                <span>{t('vault.privateProjects') || 'Proyectos Privados'}</span>
              </span>
            </div>
            <div className="space-y-1 mt-1">
              {privateSubjects.map((subject) => (
                <SubjectItemRow
                  key={subject.id}
                  subject={subject}
                  isSelected={subject.id === selectedSubjectId}
                  hasActiveNote={subject.id === activeNoteSubjectId || subject.id === secondaryNoteSubjectId}
                  count={getSubjectNoteCount(subject.id)}
                  folders={folders}
                  onSelectSubject={onSelectSubject}
                  onUpdateSubject={onUpdateSubject}
                  onDeleteSubject={onDeleteSubject}
                  onMoveNoteToFolder={onMoveNoteToFolder}
                  onMoveNoteToSubject={onMoveNoteToSubject}
                  onBatchMoveNotesToSubject={onBatchMoveNotesToSubject}
                  onMoveFolderToSubject={onMoveFolderToSubject}
                  onContextMenu={(e) => handleSubjectContextMenu(e, subject)}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer: Integrated Trash Button */}
      <div className="px-2 py-1.5 border-t border-white/[0.06] select-none">
        <button
          type="button"
          onClick={onOpenTrash}
          className="w-full flex items-center space-x-2 px-2.5 py-1.5 rounded-lg text-theme-muted hover:text-theme-text hover:bg-theme-hover transition-colors cursor-pointer group text-xs"
          title={t('trash.title') || 'Papelera de Reciclaje'}
        >
          <Trash2 size={14} className="group-hover:text-rose-400 transition-colors shrink-0" />
          <span className="text-[11px] font-medium truncate">{t('trash.title') || 'Papelera de Reciclaje'}</span>
        </button>
      </div>

      {/* Floating Drop Overlay for Creating Project from Folder (Only visible while dragging folder) */}
      <AnimatePresence>
        {isDraggingFolder && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            onDragOver={(e) => {
              e.preventDefault();
              e.stopPropagation();
              e.dataTransfer.dropEffect = 'move';
              setIsDropOverEmptySpace(true);
            }}
            onDrop={handleAsideDrop}
            className="absolute bottom-3 left-2 right-2 p-3 rounded-xl border-2 border-dashed border-theme-accent bg-theme-card/95 backdrop-blur-md shadow-2xl flex flex-col items-center justify-center space-y-1 z-40 text-center cursor-pointer ring-2 ring-theme-accent/50"
          >
            <FolderPlus size={16} className="text-theme-accent animate-bounce" />
            <span className="text-xs font-bold text-theme-text leading-tight">
              {t('nav.dropFolderToNewProject')}
            </span>
            <span className="text-[10px] text-theme-muted">
              {t('nav.dropAnywhereInColumn')}
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </aside>
  );
};
