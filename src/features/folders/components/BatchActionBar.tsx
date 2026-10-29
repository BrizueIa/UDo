import React, { useState } from 'react';
import { CheckCircle2, Trash2, FolderInput, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { FolderItem } from '../../../shared/types';

interface Props {
  selectedCount: number;
  folders: FolderItem[];
  onToggleCompleteAll: () => void;
  onMoveAllToFolder: (folderId: string) => void;
  onDeleteAll: () => void;
  onClearSelection: () => void;
}

export const BatchActionBar: React.FC<Props> = ({
  selectedCount,
  folders,
  onToggleCompleteAll,
  onMoveAllToFolder,
  onDeleteAll,
  onClearSelection,
}) => {
  const { t } = useTranslation();
  const [showFolderPicker, setShowFolderPicker] = useState(false);

  if (selectedCount < 2) return null;

  return (
    <AnimatePresence>
      <motion.div
        data-batch-action-bar
        initial={{ opacity: 0, y: 16, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 16, scale: 0.95 }}
        className="absolute bottom-3 left-3 right-3 z-40 bg-theme-sidebar border border-theme-accent/40 rounded-xl shadow-2xl p-2 flex items-center justify-between gap-1 select-none ring-1 ring-theme-accent/20"
      >
        <div className="flex items-center space-x-2 px-1">
          <span className="w-5 h-5 rounded-md bg-theme-accent text-white text-[11px] font-bold flex items-center justify-center shadow-xs">
            {selectedCount}
          </span>
          <span className="text-xs font-medium text-theme-text hidden sm:inline">
            {t('batch.selectedCount', { count: selectedCount }) || `${selectedCount} seleccionadas`}
          </span>
        </div>

        <div className="flex items-center space-x-1 relative">
          <button
            type="button"
            onClick={onToggleCompleteAll}
            title={t('batch.toggleComplete') || 'Completar selección'}
            className="p-1.5 rounded-lg text-theme-muted hover:text-[#1fd4a5] hover:bg-[#1fd4a5]/15 transition-colors"
          >
            <CheckCircle2 size={15} />
          </button>

          <div className="relative">
            <button
              type="button"
              onClick={() => setShowFolderPicker(!showFolderPicker)}
              title={t('batch.moveToFolder') || 'Mover a carpeta...'}
              className="p-1.5 rounded-lg text-theme-muted hover:text-theme-accent hover:bg-theme-accent/15 transition-colors"
            >
              <FolderInput size={15} />
            </button>

            {showFolderPicker && (
              <div className="absolute bottom-full mb-2 right-0 w-44 bg-theme-sidebar border border-theme-border rounded-xl shadow-2xl py-1.5 z-50 max-h-48 overflow-y-auto">
                <div className="px-2.5 py-1 text-[10px] font-semibold text-theme-muted uppercase tracking-wider">
                  {t('batch.selectFolder') || 'Seleccionar carpeta'}
                </div>
                {folders.map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => {
                      onMoveAllToFolder(f.id);
                      setShowFolderPicker(false);
                    }}
                    className="w-full text-left px-2.5 py-1.5 text-xs text-theme-text hover:bg-theme-hover truncate transition-colors"
                  >
                    {f.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={onDeleteAll}
            title={t('batch.deleteNotes') || 'Mover a papelera (Supr)'}
            className="p-1.5 rounded-lg text-theme-muted hover:text-rose-400 hover:bg-rose-500/15 transition-colors"
          >
            <Trash2 size={15} />
          </button>

          <div className="w-[1px] h-4 bg-theme-border/60 mx-0.5" />

          <button
            type="button"
            onClick={onClearSelection}
            title={t('batch.clear') || 'Deseleccionar (Escape)'}
            className="p-1.5 rounded-lg text-theme-muted hover:text-theme-text hover:bg-theme-hover transition-colors"
          >
            <X size={15} />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
