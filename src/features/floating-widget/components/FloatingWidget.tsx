import React, { useState } from 'react';
import { NoteItem } from '../../../shared/types';
import { Circle, Maximize2, Plus } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';

interface Props {
  notes: NoteItem[];
  onToggleComplete: (id: string) => void;
  onQuickAddNote: (title: string) => void;
  onRestoreFullApp: () => void;
}

export const FloatingWidget: React.FC<Props> = ({
  notes,
  onToggleComplete,
  onQuickAddNote,
  onRestoreFullApp,
}) => {
  const { t } = useTranslation();
  const [isExpanded, setIsExpanded] = useState(false);
  const [quickInput, setQuickInput] = useState('');

  const pendingNotes = notes.filter((n) => !n.isCompleted);

  const handleQuickAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickInput.trim()) return;
    onQuickAddNote(quickInput.trim());
    setQuickInput('');
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 select-none">
      <motion.div
        layout
        className="bg-theme-sidebar/95 backdrop-blur-md border border-theme-border/80 shadow-2xl rounded-2xl overflow-hidden flex flex-col"
        style={{ width: isExpanded ? 340 : 'auto' }}
      >
        {/* Compact Pill Bar */}
        <div
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center space-x-3 px-3.5 py-2.5 cursor-pointer hover:bg-theme-hover/40 transition-colors"
        >
          <span className="w-2.5 h-2.5 rounded-full bg-theme-accent animate-pulse" />
          <span className="text-xs font-bold text-theme-text font-sans tracking-tight">UDo</span>

          {/* Pending badge */}
          <span className="px-2 py-0.5 rounded-full bg-theme-accent/20 text-theme-accent font-mono text-[11px] font-semibold">
            {pendingNotes.length}
          </span>

          {!isExpanded && pendingNotes[0] && (
            <span className="text-xs text-theme-muted truncate max-w-[160px]">
              {pendingNotes[0].title}
            </span>
          )}

          {/* Maximize to full app */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRestoreFullApp();
            }}
            className="p-1 rounded-md text-theme-muted hover:text-theme-text hover:bg-theme-card transition-colors ml-auto"
            title={t('widget.expand')}
          >
            <Maximize2 size={13} />
          </button>
        </div>

        {/* Expanded Panel */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="border-t border-theme-border/60 p-3 space-y-2.5"
            >
              {/* Quick Add Input */}
              <form onSubmit={handleQuickAdd} className="flex items-center space-x-1.5">
                <input
                  type="text"
                  value={quickInput}
                  onChange={(e) => setQuickInput(e.target.value)}
                  placeholder={t('widget.quickAddPlaceholder')}
                  className="flex-1 bg-theme-card px-3 py-1.5 rounded-lg text-xs outline-none border border-theme-border focus:border-theme-accent text-theme-text placeholder-theme-muted"
                  autoFocus
                />
                <button
                  type="submit"
                  className="p-1.5 rounded-lg bg-theme-accent text-white hover:bg-theme-accent-hover transition-colors"
                >
                  <Plus size={14} />
                </button>
              </form>

              {/* Pending checklist */}
              <div className="max-h-56 overflow-y-auto space-y-1 pr-1">
                {pendingNotes.length === 0 ? (
                  <div className="text-center py-4 text-xs text-theme-muted">
                    {t('widget.noPending')}
                  </div>
                ) : (
                  pendingNotes.slice(0, 8).map((note) => (
                    <div
                      key={note.id}
                      onClick={() => onToggleComplete(note.id)}
                      className="group flex items-center space-x-2 px-2 py-1.5 rounded-lg hover:bg-theme-card cursor-pointer transition-colors"
                    >
                      <button className="text-theme-muted group-hover:text-theme-accent transition-colors">
                        <Circle size={14} />
                      </button>
                      <span className="text-xs text-theme-text truncate flex-1">{note.title}</span>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};
