import React, { useState } from 'react';
import { SubjectItem } from '../../../shared/types';
import { Plus, Check, X, Pencil, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';

const COLOR_PALETTE = [
  '#f97316', // Orange
  '#10b981', // Emerald
  '#6366f1', // Indigo
  '#ec4899', // Pink
  '#3b82f6', // Blue
  '#eab308', // Amber
  '#8b5cf6', // Purple
  '#14b8a6', // Teal
];

interface Props {
  subjects: SubjectItem[];
  selectedSubjectId: string;
  isFocused?: boolean;
  onSelectSubject: (id: string) => void;
  onAddSubject: (name: string, color: string) => void;
  onUpdateSubject: (subject: SubjectItem) => void;
  onDeleteSubject: (id: string) => void;
  getSubjectNoteCount: (id: string) => number;
}

export const SubjectsSidebar: React.FC<Props> = ({
  subjects,
  selectedSubjectId,
  isFocused = false,
  onSelectSubject,
  onAddSubject,
  onUpdateSubject,
  onDeleteSubject,
  getSubjectNoteCount,
}) => {
  const { t } = useTranslation();

  // New Subject State
  const [isCreating, setIsCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [newColor, setNewColor] = useState(COLOR_PALETTE[0]);

  // Edit Subject State
  const [editingSubjectId, setEditingSubjectId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editColor, setEditColor] = useState('');

  // Confirm delete state
  const [deletingSubjectId, setDeletingSubjectId] = useState<string | null>(null);

  const handleStartCreate = () => {
    setIsCreating(true);
    setNewName('');
    const randomColor = COLOR_PALETTE[subjects.length % COLOR_PALETTE.length];
    setNewColor(randomColor);
    setEditingSubjectId(null);
  };

  const handleSaveCreate = () => {
    const trimmed = newName.trim();
    if (trimmed) {
      onAddSubject(trimmed, newColor);
    }
    setIsCreating(false);
    setNewName('');
  };

  const handleStartEdit = (subject: SubjectItem, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingSubjectId(subject.id);
    setEditName(subject.name);
    setEditColor(subject.color);
    setIsCreating(false);
  };

  const handleSaveEdit = (subject: SubjectItem, e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = editName.trim();
    if (trimmed) {
      onUpdateSubject({
        ...subject,
        name: trimmed,
        color: editColor,
      });
    }
    setEditingSubjectId(null);
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onDeleteSubject(id);
    setDeletingSubjectId(null);
  };

  return (
    <aside
      className={`w-56 flex-shrink-0 bg-theme-sidebar border-r border-theme-border flex flex-col h-full select-none transition-all ${
        isFocused ? 'ring-1 ring-inset ring-theme-accent/40 shadow-sm' : ''
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-theme-border/50">
        <span className="text-xs font-semibold tracking-wider text-theme-muted uppercase">
          {t('nav.subjects')}
        </span>
        <button
          onClick={handleStartCreate}
          className="p-1 rounded-md text-theme-muted hover:text-theme-text hover:bg-theme-hover transition-colors"
          title={t('nav.addSubject')}
        >
          <Plus size={15} />
        </button>
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
                  className={`w-4 h-4 rounded-full transition-transform ${
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
                title="Cancel"
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
                <span>Save</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Subjects List */}
      <div className="flex-1 overflow-y-auto px-2 py-2 space-y-1">
        {subjects.map((subject) => {
          const isSelected = subject.id === selectedSubjectId;
          const isEditing = editingSubjectId === subject.id;
          const count = getSubjectNoteCount(subject.id);

          if (isEditing) {
            return (
              <div
                key={subject.id}
                className="p-2.5 bg-theme-card border border-theme-accent/40 rounded-xl space-y-2 shadow-sm"
              >
                <input
                  type="text"
                  autoFocus
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveEdit(subject);
                    if (e.key === 'Escape') setEditingSubjectId(null);
                  }}
                  className="w-full bg-theme-column px-2 py-1 rounded text-xs outline-none border border-theme-border text-theme-text"
                />

                <div className="flex items-center justify-between px-1">
                  {COLOR_PALETTE.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setEditColor(c)}
                      className={`w-4 h-4 rounded-full transition-transform ${
                        editColor === c ? 'scale-125 ring-2 ring-white/60' : 'opacity-80 hover:opacity-100'
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>

                <div className="flex items-center justify-end space-x-1 pt-1">
                  <button
                    onClick={() => setEditingSubjectId(null)}
                    className="p-1 rounded text-theme-muted hover:text-theme-text"
                  >
                    <X size={13} />
                  </button>
                  <button
                    onClick={() => handleSaveEdit(subject)}
                    className="p-1 rounded bg-theme-accent text-white hover:bg-theme-accent-hover"
                  >
                    <Check size={13} />
                  </button>
                </div>
              </div>
            );
          }

          return (
            <motion.div
              key={subject.id}
              onClick={() => onSelectSubject(subject.id)}
              whileHover={{ x: 2 }}
              whileTap={{ scale: 0.98 }}
              className={`group relative w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer select-none ${
                isSelected
                  ? 'text-theme-text font-semibold'
                  : 'text-theme-muted hover:text-theme-text hover:bg-theme-hover/40'
              }`}
            >
              {/* Sliding Active Pill */}
              {isSelected && (
                <motion.div
                  layoutId="active-subject-pill"
                  className="absolute inset-0 bg-theme-card border border-theme-accent/40 rounded-lg shadow-sm"
                  transition={{ type: 'spring', stiffness: 450, damping: 32 }}
                />
              )}

              <div className="relative z-10 flex items-center space-x-2.5 min-w-0 flex-1">
                <span
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0 shadow-sm transition-transform group-hover:scale-110"
                  style={{ backgroundColor: subject.color }}
                />
                <span className="truncate text-[13px]">{subject.name}</span>
              </div>

              {/* Action Buttons (visible on hover) or Count Badge */}
              <div className="relative z-10 flex items-center space-x-1 flex-shrink-0">
                <div className="opacity-0 group-hover:opacity-100 flex items-center space-x-0.5 transition-opacity">
                  <button
                    onClick={(e) => handleStartEdit(subject, e)}
                    className="p-1 text-theme-muted hover:text-theme-text hover:bg-theme-hover rounded"
                    title="Edit project"
                  >
                    <Pencil size={12} />
                  </button>
                  {deletingSubjectId === subject.id ? (
                    <div className="flex items-center space-x-0.5 bg-red-500/10 px-1 py-0.5 rounded border border-red-500/30">
                      <button
                        onClick={(e) => handleDelete(subject.id, e)}
                        className="text-[10px] text-red-400 font-bold px-1 hover:underline"
                        title="Confirm delete"
                      >
                        Del
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeletingSubjectId(null);
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
                        setDeletingSubjectId(subject.id);
                      }}
                      className="p-1 text-theme-muted hover:text-red-400 hover:bg-theme-hover rounded"
                      title="Delete project"
                    >
                      <Trash2 size={12} />
                    </button>
                  )}
                </div>

                {count > 0 && deletingSubjectId !== subject.id && (
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-mono text-[11px] group-hover:hidden ${
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
          );
        })}
      </div>
    </aside>
  );
};
