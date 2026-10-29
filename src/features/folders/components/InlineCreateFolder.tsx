import React, { useState } from 'react';
import { X, Check } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: (name: string) => void;
}

export const InlineCreateFolder: React.FC<Props> = ({ isOpen, onClose, onSave }) => {
  const { t } = useTranslation();
  const [name, setName] = useState('');

  const handleSave = () => {
    const trimmed = name.trim();
    if (trimmed) {
      onSave(trimmed);
      setName('');
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
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
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSave();
              if (e.key === 'Escape') onClose();
            }}
            className="w-full bg-theme-sidebar px-2 py-1 rounded text-xs outline-none border border-theme-border focus:border-theme-accent text-theme-text"
          />
          <div className="flex items-center justify-end space-x-1">
            <button
              type="button"
              onClick={onClose}
              className="p-1 text-theme-muted hover:text-theme-text rounded"
            >
              <X size={13} />
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={!name.trim()}
              className="flex items-center space-x-1 px-2 py-0.5 rounded bg-theme-accent text-white text-xs font-semibold hover:bg-theme-accent-hover disabled:opacity-50"
            >
              <Check size={12} />
              <span>{t('note.save')}</span>
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
