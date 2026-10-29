import React, { useState, useEffect, useCallback } from 'react';
import { Trash2, RotateCcw, X, AlertTriangle, CheckSquare, Square } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { trashIpc } from '../api/trashIpc';
import { NoteItem, SubjectItem, FolderItem } from '../../../shared/types';
import { formatRelativeTime } from '../../../shared/utils/formatTime';

interface Props {
  isOpen: boolean;
  isVaultUnlocked: boolean;
  subjects: SubjectItem[];
  folders: FolderItem[];
  onClose: () => void;
  onNotesRestored: () => void;
}

export const TrashModal: React.FC<Props> = ({
  isOpen,
  isVaultUnlocked,
  subjects,
  folders,
  onClose,
  onNotesRestored,
}) => {
  const { t, i18n } = useTranslation();
  const [deletedNotes, setDeletedNotes] = useState<NoteItem[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isConfirmingEmpty, setIsConfirmingEmpty] = useState(false);
  const [loading, setLoading] = useState(false);

  const loadDeletedNotes = useCallback(async () => {
    setLoading(true);
    try {
      const notes = await trashIpc.getDeletedNotes(isVaultUnlocked);
      setDeletedNotes(notes);
      setSelectedIds(new Set());
    } finally {
      setLoading(false);
    }
  }, [isVaultUnlocked]);

  useEffect(() => {
    if (isOpen) {
      loadDeletedNotes();
      setIsConfirmingEmpty(false);
    }
  }, [isOpen, loadDeletedNotes]);

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSelectAll = () => {
    if (selectedIds.size === deletedNotes.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(deletedNotes.map((n) => n.id)));
    }
  };

  const handleRestoreSelected = async () => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;
    await trashIpc.restoreNotesBatch(ids);
    onNotesRestored();
    loadDeletedNotes();
  };

  const handleRestoreSingle = async (id: string) => {
    await trashIpc.restoreNote(id);
    onNotesRestored();
    loadDeletedNotes();
  };

  const handlePermanentlyDeleteSelected = async () => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;
    await trashIpc.permanentlyDeleteNotes(ids);
    loadDeletedNotes();
  };

  const handleEmptyTrash = async () => {
    await trashIpc.emptyTrash(isVaultUnlocked);
    setIsConfirmingEmpty(false);
    loadDeletedNotes();
  };

  if (!isOpen) return null;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 select-none"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl bg-theme-sidebar border border-theme-border rounded-2xl shadow-2xl flex flex-col h-[520px] max-h-[85vh] overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-theme-border/60">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-theme-hover flex items-center justify-center text-rose-400">
              <Trash2 size={16} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-theme-text">{t('trash.title') || 'Papelera de Reciclaje'}</h3>
              <p className="text-[11px] text-theme-muted">
                {t('trash.noteCount', { count: deletedNotes.length }) || `${deletedNotes.length} notas eliminadas`}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {deletedNotes.length > 0 && !isConfirmingEmpty && (
              <button
                type="button"
                onClick={() => setIsConfirmingEmpty(true)}
                className="px-2.5 py-1 rounded-lg text-xs font-semibold text-rose-400 hover:bg-rose-500/15 transition-colors cursor-pointer"
              >
                {t('trash.empty') || 'Vaciar papelera'}
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded-lg text-theme-muted hover:text-theme-text hover:bg-theme-hover transition-colors cursor-pointer"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Empty Trash Confirmation Bar */}
        <AnimatePresence>
          {isConfirmingEmpty && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="bg-rose-500/10 border-b border-rose-500/20 px-5 py-2.5 flex items-center justify-between"
            >
              <div className="flex items-center space-x-2 text-rose-400 text-xs font-medium">
                <AlertTriangle size={14} />
                <span>{t('trash.emptyConfirm') || '¿Eliminar permanentemente todas las notas de la papelera?'}</span>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setIsConfirmingEmpty(false)}
                  className="px-2.5 py-1 text-xs text-theme-muted hover:text-theme-text transition-colors cursor-pointer"
                >
                  {t('nav.cancel')}
                </button>
                <button
                  type="button"
                  onClick={handleEmptyTrash}
                  className="px-3 py-1 rounded-lg bg-rose-500 hover:bg-rose-600 text-white text-xs font-semibold transition-colors cursor-pointer"
                >
                  {t('trash.confirmEmpty') || 'Sí, vaciar'}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Selection Toolbar */}
        {deletedNotes.length > 0 && (
          <div className="px-5 py-2 bg-theme-column/30 border-b border-theme-border/40 flex items-center justify-between text-xs">
            <button
              type="button"
              onClick={handleSelectAll}
              className="flex items-center space-x-2 text-theme-muted hover:text-theme-text transition-colors cursor-pointer"
            >
              {selectedIds.size === deletedNotes.length ? (
                <CheckSquare size={14} className="text-theme-accent" />
              ) : (
                <Square size={14} />
              )}
              <span className="text-[11px] font-medium">{t('trash.selectAll') || 'Seleccionar todo'}</span>
            </button>

            {selectedIds.size > 0 && (
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={handleRestoreSelected}
                  className="flex items-center space-x-1 px-2 py-0.5 rounded-lg text-theme-accent hover:bg-theme-accent/15 font-medium transition-colors cursor-pointer"
                >
                  <RotateCcw size={12} />
                  <span>{t('trash.restoreSelected', { count: selectedIds.size }) || `Restaurar (${selectedIds.size})`}</span>
                </button>
                <button
                  type="button"
                  onClick={handlePermanentlyDeleteSelected}
                  className="flex items-center space-x-1 px-2 py-0.5 rounded-lg text-rose-400 hover:bg-rose-500/15 font-medium transition-colors cursor-pointer"
                >
                  <Trash2 size={12} />
                  <span>{t('trash.deleteSelected') || 'Eliminar'}</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* List of deleted notes */}
        <div className="flex-1 overflow-y-auto px-4 py-2 space-y-0.5">
          {loading ? (
            <div className="flex items-center justify-center h-48 text-theme-muted text-xs">
              {t('settings.loading') || 'Cargando...'}
            </div>
          ) : deletedNotes.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-56 text-theme-muted space-y-2">
              <Trash2 size={28} className="opacity-30" />
              <p className="text-xs">{t('trash.emptyState') || 'La papelera está vacía'}</p>
            </div>
          ) : (
            deletedNotes.map((note) => {
              const isSelected = selectedIds.has(note.id);
              const subject = subjects.find((s) => s.id === note.subjectId);
              const folder = folders.find((f) => f.id === note.folderId);
              const formattedTime = formatRelativeTime(note.updatedAt, i18n.language);

              return (
                <div
                  key={note.id}
                  onClick={() => handleToggleSelect(note.id)}
                  className={`group flex items-center justify-between px-3 py-2 rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-theme-accent/15 border-theme-accent/30 text-theme-text'
                      : 'border-transparent hover:bg-theme-card/70 hover:border-theme-border/40 text-theme-text'
                  }`}
                >
                  <div className="flex items-center space-x-2.5 min-w-0 flex-1">
                    <div className="text-theme-muted shrink-0">
                      {isSelected ? (
                        <CheckSquare size={14} className="text-theme-accent" />
                      ) : (
                        <Square size={14} />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-medium truncate">{note.title || t('note.titlePlaceholder')}</div>
                      <div className="text-[11px] text-theme-muted flex items-center space-x-1.5 mt-0.5 truncate">
                        {subject && (
                          <span className="flex items-center space-x-1 truncate shrink-0">
                            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: subject.color }} />
                            <span className="truncate">{subject.name}</span>
                          </span>
                        )}
                        {folder && <span className="truncate">/ {folder.name}</span>}
                        <span className="shrink-0">• {formattedTime}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-1 ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRestoreSingle(note.id);
                      }}
                      title={t('trash.restore') || 'Restaurar'}
                      className="p-1 rounded-md text-theme-muted hover:text-theme-accent hover:bg-theme-accent/15 transition-colors cursor-pointer"
                    >
                      <RotateCcw size={13} />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        trashIpc.permanentlyDeleteNotes([note.id]).then(() => loadDeletedNotes());
                      }}
                      title={t('trash.permanentlyDelete') || 'Eliminar definitivamente'}
                      className="p-1 rounded-md text-theme-muted hover:text-rose-400 hover:bg-rose-500/15 transition-colors cursor-pointer"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
