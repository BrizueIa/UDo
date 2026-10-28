import React, { useState, useEffect, useRef } from 'react';
import { Folder, CornerDownLeft, Sparkles, X, ChevronDown } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { SubjectItem, FolderItem } from '../../../shared/types';

interface Props {
  isOpen: boolean;
  subjects: SubjectItem[];
  folders: FolderItem[];
  defaultSubjectId?: string;
  defaultFolderId?: string;
  onClose: () => void;
  onSave: (title: string, folderId: string, subjectId: string) => void;
}

export const QuickAddModal: React.FC<Props> = ({
  isOpen, subjects, folders, defaultSubjectId, defaultFolderId, onClose, onSave,
}) => {
  const { t } = useTranslation();
  const [title, setTitle] = useState('');
  const [selectedFolderIndex, setSelectedFolderIndex] = useState(0);
  const [isFolderDropdownOpen, setIsFolderDropdownOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const availableFolders = folders.length > 0 ? folders : [];

  useEffect(() => {
    if (isOpen) {
      setTitle('');
      setIsFolderDropdownOpen(false);
      const defIdx = availableFolders.findIndex((f) => f.id === defaultFolderId || f.subjectId === defaultSubjectId);
      setSelectedFolderIndex(defIdx >= 0 ? defIdx : 0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen, defaultFolderId, defaultSubjectId, availableFolders]);

  if (!isOpen) return null;
  const currentFolder = availableFolders[selectedFolderIndex];
  const currentSubject = subjects.find((s) => s.id === currentFolder?.subjectId);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      if (isFolderDropdownOpen) setIsFolderDropdownOpen(false);
      else onClose();
    } else if (e.key === 'Tab' || e.key === 'ArrowDown') {
      e.preventDefault();
      if (availableFolders.length > 0) {
        setSelectedFolderIndex((prev) => e.shiftKey ? (prev - 1 + availableFolders.length) % availableFolders.length : (prev + 1) % availableFolders.length);
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (availableFolders.length > 0) {
        setSelectedFolderIndex((prev) => (prev - 1 + availableFolders.length) % availableFolders.length);
      }
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const trimmed = title.trim();
      if (trimmed && currentFolder) {
        onSave(trimmed, currentFolder.id, currentFolder.subjectId);
        onClose();
      }
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-start justify-center pt-28 px-4 bg-black/60 backdrop-blur-sm select-none" onClick={() => { setIsFolderDropdownOpen(false); onClose(); }}>
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: -15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: -15 }}
          transition={{ type: 'spring', stiffness: 450, damping: 30 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-xl bg-theme-base border border-white/[0.1] rounded-2xl shadow-2xl p-4 text-theme-text relative"
        >
          {/* Spotlight Input Row */}
          <div className="flex items-center space-x-3 px-2 py-1">
            <span className="p-2 rounded-xl bg-theme-accent/20 text-theme-accent flex-shrink-0"><Sparkles size={18} /></span>
            <input
              ref={inputRef}
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={t('quickAdd.placeholder')}
              className="flex-1 bg-transparent text-sm font-medium text-theme-text placeholder-theme-muted outline-none"
            />
            <button onClick={onClose} className="p-1.5 rounded-lg text-theme-muted hover:text-theme-text hover:bg-theme-card transition-colors cursor-pointer"><X size={16} /></button>
          </div>

          {/* Destination Selector Bar & Hints */}
          <div className="mt-3 pt-3 border-t border-white/[0.06] flex items-center justify-between text-xs text-theme-muted relative">
            <div className="flex items-center space-x-2 relative">
              <span className="text-[11px] font-semibold text-theme-muted/80">{t('quickAdd.destination')}:</span>
              {currentFolder ? (
                <button
                  type="button"
                  onClick={() => setIsFolderDropdownOpen(!isFolderDropdownOpen)}
                  className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-theme-card hover:bg-theme-hover border border-white/[0.08] text-theme-text cursor-pointer transition-colors"
                  title={t('quickAdd.changeDestinationHint')}
                >
                  <Folder size={12} className="text-theme-accent" />
                  <span className="font-semibold">{currentFolder.name}</span>
                  {currentSubject && <span className="text-[10px] text-theme-muted">({currentSubject.name})</span>}
                  <ChevronDown size={11} className="text-theme-muted" />
                </button>
              ) : (
                <span className="text-xs text-theme-muted italic">{t('quickAdd.noFolders')}</span>
              )}

              {/* Folders Dropdown Menu */}
              {isFolderDropdownOpen && (
                <div className="absolute left-0 top-full mt-2 w-64 max-h-52 overflow-y-auto bg-theme-card border border-white/[0.1] rounded-xl shadow-2xl p-1 z-50">
                  {availableFolders.map((f, idx) => {
                    const subj = subjects.find((s) => s.id === f.subjectId);
                    return (
                      <button
                        key={f.id}
                        type="button"
                        onClick={() => { setSelectedFolderIndex(idx); setIsFolderDropdownOpen(false); inputRef.current?.focus(); }}
                        className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs flex items-center justify-between transition-colors ${
                          idx === selectedFolderIndex ? 'bg-theme-accent text-white font-semibold' : 'hover:bg-theme-hover text-theme-text'
                        }`}
                      >
                        <span className="truncate">{f.name}</span>
                        {subj && <span className={`text-[10px] ml-2 shrink-0 ${idx === selectedFolderIndex ? 'text-white/80' : 'text-theme-muted'}`}>{subj.name}</span>}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="flex items-center space-x-2 text-[11px]">
              <span className="hidden sm:inline text-theme-muted/70">{t('quickAdd.keyboardHint')}</span>
              <button
                disabled={!title.trim() || !currentFolder}
                onClick={() => {
                  const trimmed = title.trim();
                  if (trimmed && currentFolder) { onSave(trimmed, currentFolder.id, currentFolder.subjectId); onClose(); }
                }}
                className={`flex items-center space-x-1 px-2.5 py-1 rounded-lg font-semibold text-xs transition-all ${
                  title.trim() && currentFolder ? 'bg-theme-accent text-white shadow-sm cursor-pointer' : 'bg-theme-card/60 text-theme-muted/40 cursor-not-allowed'
                }`}
              >
                <span>{t('quickAdd.save')}</span>
                <CornerDownLeft size={12} />
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
