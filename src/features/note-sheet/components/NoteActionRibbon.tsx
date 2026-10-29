import React, { useState, useRef, useEffect } from 'react';
import { NoteItem, FolderItem } from '../../../shared/types';
import { CheckSquare, Pin, ChevronDown, Trash2, Timer, Folder } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { renderRichTitle } from '../utils/inlineRichTextParser';

interface Props {
  note: NoteItem;
  folderName: string;
  folders: FolderItem[];
  activeTimerFormatted?: string;
  isTimerRunning?: boolean;
  onToggleComplete: () => void;
  onTogglePin: () => void;
  onSelectFolder: (folderId: string) => void;
  onDeleteNote: (id: string) => void;
  onOpenFocusTimer?: () => void;
}

export const NoteActionRibbon: React.FC<Props> = ({
  note,
  folderName,
  folders,
  activeTimerFormatted,
  isTimerRunning,
  onToggleComplete,
  onTogglePin,
  onSelectFolder,
  onDeleteNote,
  onOpenFocusTimer,
}) => {
  const { t } = useTranslation();
  const [showFolderPicker, setShowFolderPicker] = useState(false);
  const folderPickerRef = useRef<HTMLDivElement>(null);

  // Close folder picker on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (folderPickerRef.current && !folderPickerRef.current.contains(e.target as Node)) {
        setShowFolderPicker(false);
      }
    };
    if (showFolderPicker) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showFolderPicker]);

  const subjectFolders = folders.filter((f) => f.subjectId === note.subjectId);
  const displayFolders = subjectFolders.length > 0 ? subjectFolders : folders;

  return (
    <div className="flex items-center justify-between px-4 sm:px-6 lg:px-8 py-3.5 border-b border-theme-border/60 bg-theme-base sticky top-0 z-10 select-none flex-wrap gap-2">
      <div className="flex items-center flex-wrap gap-2">
        {/* Toggle complete button */}
        <button
          onClick={onToggleComplete}
          className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
            note.isCompleted
              ? 'bg-[#1fd4a5]/20 text-[#1fd4a5] border border-[#1fd4a5]/40 shadow-xs'
              : 'bg-theme-card hover:bg-theme-hover text-theme-text border border-white/[0.06]'
          }`}
        >
          <CheckSquare size={13} />
          <span>{t('note.toggleComplete')}</span>
        </button>

        {/* Pin note button */}
        <button
          onClick={onTogglePin}
          className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
            note.isPinned
              ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40 shadow-sm'
              : 'bg-theme-card hover:bg-theme-hover text-theme-muted hover:text-theme-text border border-white/[0.06]'
          }`}
          title={note.isPinned ? t('note.unpin') : t('note.pinToTop')}
        >
          <Pin size={13} className={note.isPinned ? 'fill-amber-400 rotate-45' : 'rotate-45'} />
          <span>{note.isPinned ? t('note.pinned') : t('note.pin')}</span>
        </button>

        {/* Focus Timer Sprint Button (FR-14) */}
        {onOpenFocusTimer && (
          <button
            key={isTimerRunning ? 'timer-running' : 'timer-idle'}
            onClick={onOpenFocusTimer}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer whitespace-nowrap flex-shrink-0 ${
              isTimerRunning
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-sm'
                : 'bg-theme-card hover:bg-theme-hover text-theme-muted hover:text-theme-text border border-white/[0.06]'
            }`}
            title={t('focusTimer.title')}
          >
            {isTimerRunning ? (
              <span className="relative flex h-2 w-2 mr-0.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
            ) : (
              <Timer size={13} />
            )}
            <span className="font-mono">
              {isTimerRunning && activeTimerFormatted
                ? `${t('note.focusTimer')} · ${activeTimerFormatted}`
                : t('note.focusTimer')}
            </span>
          </button>
        )}

        {/* Folder Destination Picker Dropdown */}
        <div className="relative" ref={folderPickerRef}>
          <button
            onClick={() => setShowFolderPicker(!showFolderPicker)}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs bg-theme-card/80 hover:bg-theme-card text-theme-text border border-white/[0.06] transition-colors shadow-sm cursor-pointer"
            title={t('note.moveToFolder')}
          >
            <Folder size={13} className="text-amber-400 fill-amber-400/20 shrink-0" />
            <span className="font-medium truncate max-w-[120px]">
              {renderRichTitle(folderName, 'ribbon', 0, { ignoreSize: true })}
            </span>
            <ChevronDown size={12} className="text-theme-muted" />
          </button>

          <AnimatePresence>
            {showFolderPicker && (
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 5 }}
                className="absolute top-full left-0 mt-1.5 w-48 bg-theme-card border border-white/[0.08] rounded-xl shadow-2xl py-1 z-30 overflow-hidden"
              >
                <div className="px-3 py-1.5 text-[10px] font-semibold text-theme-muted uppercase tracking-wider border-b border-white/[0.05]">
                  {t('note.moveToFolder')}
                </div>
                <div className="max-h-48 overflow-y-auto py-1">
                  {displayFolders.map((f) => (
                    <button
                      key={f.id}
                      onClick={() => {
                        onSelectFolder(f.id);
                        setShowFolderPicker(false);
                      }}
                      className={`w-full text-left px-3 py-1.5 text-xs flex items-center space-x-2 hover:bg-theme-hover transition-colors ${
                        f.id === note.folderId
                          ? 'text-theme-accent font-semibold bg-theme-hover/50'
                          : 'text-theme-text'
                      }`}
                    >
                      <Folder size={13} className="text-amber-400 fill-amber-400/20 shrink-0" />
                      <span className="truncate">
                        {renderRichTitle(f.name, 'ribbon-f', 0, { ignoreSize: true })}
                      </span>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Delete note button */}
      <button
        onClick={() => onDeleteNote(note.id)}
        className="p-1.5 rounded-md text-theme-muted hover:text-red-400 hover:bg-theme-hover transition-colors"
        title={t('note.deleteNote')}
      >
        <Trash2 size={16} />
      </button>
    </div>
  );
};
