import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Trash2, RotateCcw, X, AlertTriangle, CheckSquare, Square, Search, Clock } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { trashIpc } from '../api/trashIpc';
import { NoteItem, SubjectItem, FolderItem } from '../../../shared/types';
import { normalizeDiacritics } from '../../../shared/utils/diacritics';
import { TrashItemRow } from './TrashItemRow';

interface Props {
  isOpen: boolean;
  isVaultUnlocked: boolean;
  subjects: SubjectItem[];
  folders: FolderItem[];
  onClose: () => void;
  onNotesRestored: () => void;
}

type TrashTab = 'all' | 'day' | 'week' | 'month';

export const TrashModal: React.FC<Props> = ({
  isOpen,
  isVaultUnlocked,
  subjects,
  folders,
  onClose,
  onNotesRestored,
}) => {
  const { t } = useTranslation();
  const [deletedNotes, setDeletedNotes] = useState<NoteItem[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isConfirmingEmpty, setIsConfirmingEmpty] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<TrashTab>('all');
  const [searchQuery, setSearchQuery] = useState('');

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
      setSearchQuery('');
      setActiveTab('all');
    }
  }, [isOpen, loadDeletedNotes]);

  const { isToday, isWithinDays } = useMemo(() => {
    const now = new Date();
    return {
      isToday: (dStr: string) => {
        const d = new Date(dStr);
        return (
          d.getDate() === now.getDate() &&
          d.getMonth() === now.getMonth() &&
          d.getFullYear() === now.getFullYear()
        );
      },
      isWithinDays: (dStr: string, days: number) => {
        const diff = now.getTime() - new Date(dStr).getTime();
        return diff >= 0 && diff <= days * 86400000;
      },
    };
  }, []);

  const counts = useMemo(() => ({
    all: deletedNotes.length,
    day: deletedNotes.filter((n) => isToday(n.updatedAt) || isWithinDays(n.updatedAt, 1)).length,
    week: deletedNotes.filter((n) => isWithinDays(n.updatedAt, 7)).length,
    month: deletedNotes.filter((n) => isWithinDays(n.updatedAt, 30)).length,
  }), [deletedNotes, isToday, isWithinDays]);

  const filteredNotes = useMemo(() => {
    return deletedNotes.filter((n) => {
      if (activeTab === 'day' && !isToday(n.updatedAt) && !isWithinDays(n.updatedAt, 1)) return false;
      if (activeTab === 'week' && !isWithinDays(n.updatedAt, 7)) return false;
      if (activeTab === 'month' && !isWithinDays(n.updatedAt, 30)) return false;

      if (searchQuery.trim()) {
        const raw = searchQuery.trim().toLowerCase();
        if (raw === '.canvas' || raw === 'canvas' || raw === '.sketch') {
          return (n.sketches && n.sketches.length > 0) || false;
        }

        if (raw === '.audio' || raw === 'audio') {
          return (n.attachments && n.attachments.some((a) => a.kind === 'audio')) || false;
        }

        const tokens = normalizeDiacritics(raw).split(/\s+/).filter(Boolean);
        const sub = subjects.find((s) => s.id === n.subjectId);
        const fol = folders.find((f) => f.id === n.folderId);

        const subName = sub ? normalizeDiacritics(sub.name) : '';
        const folName = fol ? normalizeDiacritics(fol.name) : '';
        const titleNorm = normalizeDiacritics(n.title);
        const contentNorm = normalizeDiacritics(n.content);
        const tagsNorm = n.tags.map((t) => normalizeDiacritics(t)).join(' ');
        const sketchesNorm = (n.sketches || []).map((s) => normalizeDiacritics(s.title || '')).join(' ');
        const attachmentsNorm = (n.attachments || []).map((a) => `${normalizeDiacritics(a.name || '')} ${normalizeDiacritics(a.extension || '')} ${a.kind || ''}`).join(' ');

        const searchable = `${titleNorm} ${contentNorm} ${tagsNorm} ${subName} ${folName} ${sketchesNorm} ${attachmentsNorm}`;
        if (!tokens.every((token) => searchable.includes(token))) return false;
      }
      return true;
    });
  }, [deletedNotes, activeTab, searchQuery, subjects, folders, isToday, isWithinDays]);

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSelectAll = () => {
    if (selectedIds.size === filteredNotes.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredNotes.map((n) => n.id)));
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

  const tabs: { key: TrashTab; label: string; count: number }[] = [
    { key: 'all', label: t('trash.tabAll') || 'Todas', count: counts.all },
    { key: 'day', label: t('trash.tabDay') || 'Hoy', count: counts.day },
    { key: 'week', label: t('trash.tabWeek') || 'Semana', count: counts.week },
    { key: 'month', label: t('trash.tabMonth') || 'Mes', count: counts.month },
  ];

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 select-none"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl bg-theme-sidebar border border-white/[0.08] rounded-2xl shadow-2xl flex flex-col h-[540px] max-h-[85vh] overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/[0.06]">
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

        {/* Tabs & Search Filter Toolbar */}
        <div className="px-5 py-2.5 bg-theme-column/40 border-b border-white/[0.06] flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center space-x-1 bg-theme-base/60 p-0.5 rounded-lg border border-white/[0.06]">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => {
                  setActiveTab(tab.key);
                  setSelectedIds(new Set());
                }}
                className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                  activeTab === tab.key
                    ? 'bg-theme-card text-theme-text shadow-xs'
                    : 'text-theme-muted hover:text-theme-text'
                }`}
              >
                <span>{tab.label}</span>
                <span className="text-[10px] font-mono px-1 py-0.2 rounded-full bg-theme-hover text-theme-muted">
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-theme-base/80 border border-white/[0.08] text-xs text-theme-muted focus-within:text-theme-text focus-within:border-theme-accent/50 w-48">
            <Search size={13} className="shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('trash.searchPlaceholder') || 'Buscar notas...'}
              className="bg-transparent text-xs text-theme-text outline-none placeholder-theme-muted w-full"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="text-theme-muted hover:text-theme-text p-0.5"
              >
                <X size={11} />
              </button>
            )}
          </div>
        </div>

        {/* Action Selection Bar */}
        {filteredNotes.length > 0 && (
          <div className="px-5 py-2 bg-theme-column/20 border-b border-white/[0.04] flex items-center justify-between text-xs">
            <button
              type="button"
              onClick={handleSelectAll}
              className="flex items-center space-x-2 text-theme-muted hover:text-theme-text transition-colors cursor-pointer"
            >
              {selectedIds.size === filteredNotes.length && filteredNotes.length > 0 ? (
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
          ) : filteredNotes.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-56 text-theme-muted space-y-2">
              <Trash2 size={28} className="opacity-30" />
              <p className="text-xs">
                {searchQuery || activeTab !== 'all'
                  ? t('trash.noResults') || 'No hay notas en este periodo o filtro'
                  : t('trash.emptyState') || 'La papelera está vacía'}
              </p>
            </div>
          ) : (
            filteredNotes.map((note) => (
              <TrashItemRow
                key={note.id}
                note={note}
                isSelected={selectedIds.has(note.id)}
                subject={subjects.find((s) => s.id === note.subjectId)}
                folder={folders.find((f) => f.id === note.folderId)}
                onToggleSelect={handleToggleSelect}
                onRestore={handleRestoreSingle}
                onPermanentlyDelete={(id) => {
                  trashIpc.permanentlyDeleteNotes([id]).then(() => loadDeletedNotes());
                }}
              />
            ))
          )}
        </div>

        {/* Auto-Delete 30 Days Notice Footer */}
        <div className="px-5 py-2.5 bg-theme-column/40 border-t border-white/[0.06] flex items-center justify-between text-[11px] text-theme-muted">
          <div className="flex items-center space-x-1.5">
            <Clock size={12} className="opacity-60 text-theme-muted" />
            <span>{t('trash.autoDeleteNotice') || 'Las notas con más de 30 días en la papelera se eliminan automáticamente.'}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
