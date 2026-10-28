import React, { useState } from 'react';
import { NoteItem } from '../../../shared/types';
import { Circle, Maximize2, Plus } from 'lucide-react';
import { useTranslation } from 'react-i18next';

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
  const [quickInput, setQuickInput] = useState('');

  const pendingNotes = notes.filter((n) => !n.isCompleted);

  const handleQuickAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickInput.trim()) return;
    onQuickAddNote(quickInput.trim());
    setQuickInput('');
  };

  return (
    <div className="w-full h-full flex flex-col bg-theme-sidebar border border-white/[0.08] select-none rounded-xl overflow-hidden shadow-2xl">
      {/* Draggable Header Bar */}
      <div
        data-tauri-drag-region
        className="flex items-center justify-between px-3.5 py-2.5 bg-theme-base/80 border-b border-white/[0.06] cursor-move"
      >
        <div className="flex items-center space-x-2" data-tauri-drag-region>
          <span className="w-2.5 h-2.5 rounded-full bg-theme-accent animate-pulse" />
          <span className="text-xs font-bold text-theme-text font-sans tracking-tight">UDo Mini</span>
          <span className="px-1.5 py-0.5 rounded-full bg-theme-accent/20 text-theme-accent font-mono text-[10px] font-semibold">
            {pendingNotes.length}
          </span>
        </div>

        {/* Maximize to full app */}
        <button
          type="button"
          onClick={onRestoreFullApp}
          className="p-1 rounded-md text-theme-muted hover:text-theme-text hover:bg-theme-card transition-colors cursor-pointer"
          title={t('widget.expand')}
        >
          <Maximize2 size={13} />
        </button>
      </div>

      {/* Quick Add Input Bar */}
      <div className="p-2.5 border-b border-white/[0.04] bg-theme-card/30">
        <form onSubmit={handleQuickAdd} className="flex items-center space-x-1.5">
          <input
            type="text"
            value={quickInput}
            onChange={(e) => setQuickInput(e.target.value)}
            placeholder={t('widget.quickAddPlaceholder')}
            className="flex-1 bg-theme-card px-2.5 py-1 rounded-lg text-xs outline-none border border-white/[0.06] focus:border-theme-accent text-theme-text placeholder-theme-muted"
            autoFocus
          />
          <button
            type="submit"
            disabled={!quickInput.trim()}
            className={`p-1.5 rounded-lg transition-colors ${
              quickInput.trim()
                ? 'bg-theme-accent text-white hover:bg-theme-accent-hover cursor-pointer'
                : 'bg-theme-card text-theme-muted/40 cursor-not-allowed'
            }`}
          >
            <Plus size={13} />
          </button>
        </form>
      </div>

      {/* Pending Checklist */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {pendingNotes.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-6 text-xs text-theme-muted">
            <span className="text-base mb-1">🎉</span>
            <span>{t('widget.noPending')}</span>
          </div>
        ) : (
          pendingNotes.map((note) => (
            <div
              key={note.id}
              onClick={() => onToggleComplete(note.id)}
              className="group flex items-center space-x-2 px-2.5 py-1.5 rounded-lg hover:bg-theme-hover/60 cursor-pointer transition-colors"
            >
              <button
                type="button"
                className="text-theme-muted group-hover:text-theme-accent transition-colors shrink-0"
              >
                <Circle size={13} />
              </button>
              <span className="text-xs text-theme-text truncate flex-1">{note.title}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
