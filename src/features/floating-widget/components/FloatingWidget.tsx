import React, { useState } from 'react';
import { NoteItem } from '../../../shared/types';
import { FocusTimerState } from '../../../shared/hooks/useFocusTimer';
import { Circle, Maximize2, Minimize2, Plus, Timer, FileText, CheckSquare, ArrowLeft } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { api } from '../../../shared/api/ipc';

interface Props {
  notes: NoteItem[];
  timer?: FocusTimerState;
  onToggleComplete: (id: string) => void;
  onQuickAddNote: (title: string) => void;
  onUpdateNote?: (note: NoteItem) => void;
  onRestoreFullApp: () => void;
}

export const FloatingWidget: React.FC<Props> = ({
  notes,
  timer,
  onToggleComplete,
  onQuickAddNote,
  onUpdateNote,
  onRestoreFullApp,
}) => {
  const { t } = useTranslation();
  const [sizeMode, setSizeMode] = useState<'compact' | 'medium'>('compact');
  const [activeTab, setActiveTab] = useState<'tasks' | 'note'>('tasks');
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const [quickInput, setQuickInput] = useState('');

  const pendingNotes = notes.filter((n) => !n.isCompleted);
  const activeNote = notes.find((n) => n.id === selectedNoteId) || pendingNotes[0] || notes[0];

  const handleToggleSize = (targetSize: 'compact' | 'medium') => {
    setSizeMode(targetSize);
    api.setWidgetSize(targetSize);
  };

  const handleQuickAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickInput.trim()) return;
    onQuickAddNote(quickInput.trim());
    setQuickInput('');
  };

  const handleOpenNote = (noteId: string) => {
    setSelectedNoteId(noteId);
    setActiveTab('note');
    if (sizeMode === 'compact') {
      handleToggleSize('medium');
    }
  };

  return (
    <div className="w-full h-full flex flex-col bg-theme-sidebar border border-white/[0.08] select-none rounded-xl overflow-hidden shadow-2xl">
      {/* Draggable Header Bar */}
      <div
        data-tauri-drag-region
        className="flex items-center justify-between px-3 py-2 bg-theme-base/90 border-b border-white/[0.06] cursor-move shrink-0"
      >
        <div className="flex items-center space-x-2" data-tauri-drag-region>
          <span className="w-2 h-2 rounded-full bg-theme-accent" />
          <span className="text-xs font-bold text-theme-text font-sans tracking-tight">
            {t('widget.title')}
          </span>

          {sizeMode === 'medium' ? (
            <div className="flex items-center space-x-1 ml-2 bg-theme-card/60 rounded-lg p-0.5">
              <button
                type="button"
                onClick={() => setActiveTab('tasks')}
                className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors cursor-pointer flex items-center space-x-1 ${
                  activeTab === 'tasks'
                    ? 'bg-theme-accent text-white shadow-sm'
                    : 'text-theme-muted hover:text-theme-text'
                }`}
              >
                <CheckSquare size={11} />
                <span>{t('widget.tasksTab')}</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('note')}
                className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors cursor-pointer flex items-center space-x-1 ${
                  activeTab === 'note'
                    ? 'bg-theme-accent text-white shadow-sm'
                    : 'text-theme-muted hover:text-theme-text'
                }`}
              >
                <FileText size={11} />
                <span>{t('widget.noteTab')}</span>
              </button>
            </div>
          ) : (
            <span className="px-1.5 py-0.2 rounded-full bg-theme-accent/20 text-theme-accent font-mono text-[10px] font-semibold">
              {pendingNotes.length}
            </span>
          )}
        </div>

        {/* Right Header Actions */}
        <div className="flex items-center space-x-1">
          {/* Active Timer Pill if running/paused */}
          {timer && (timer.isRunning || timer.isPaused) && (
            <button
              type="button"
              onClick={timer.isRunning ? timer.pauseSprint : timer.resumeSprint}
              className="flex items-center space-x-1 px-1.5 py-0.5 rounded-md bg-emerald-500/20 text-emerald-400 font-mono text-[10px] hover:bg-emerald-500/30 transition-colors cursor-pointer mr-1"
              title={timer.isRunning ? t('focusTimer.pause') : t('focusTimer.resume')}
            >
              <Timer size={10} className={timer.isRunning ? 'animate-pulse' : ''} />
              <span>{timer.formattedTime}</span>
            </button>
          )}

          {/* Toggle Compact <-> Medium size */}
          {sizeMode === 'compact' ? (
            <button
              type="button"
              onClick={() => handleToggleSize('medium')}
              className="p-1 rounded text-theme-muted hover:text-theme-text hover:bg-theme-card transition-colors cursor-pointer"
              title={t('widget.expandMedium')}
            >
              <FileText size={13} />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => handleToggleSize('compact')}
              className="p-1 rounded text-theme-muted hover:text-theme-text hover:bg-theme-card transition-colors cursor-pointer"
              title={t('widget.shrinkCompact')}
            >
              <Minimize2 size={13} />
            </button>
          )}

          {/* Maximize to full 3-column app */}
          <button
            type="button"
            onClick={onRestoreFullApp}
            className="p-1 rounded text-theme-muted hover:text-theme-text hover:bg-theme-card transition-colors cursor-pointer"
            title={t('widget.expand')}
          >
            <Maximize2 size={13} />
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      {sizeMode === 'medium' && activeTab === 'note' && activeNote ? (
        /* Note Editor View (Medium Size) */
        <div className="flex-1 flex flex-col p-3 overflow-hidden space-y-2 bg-theme-base/40">
          <div className="flex items-center justify-between border-b border-white/[0.06] pb-1.5">
            <input
              type="text"
              value={activeNote.title}
              onChange={(e) => {
                onUpdateNote?.({
                  ...activeNote,
                  title: e.target.value,
                  updatedAt: new Date().toISOString(),
                });
              }}
              className="w-full bg-transparent font-bold text-sm text-theme-text outline-none"
              placeholder={t('note.titlePlaceholder')}
            />
          </div>

          <textarea
            value={activeNote.content}
            onChange={(e) => {
              onUpdateNote?.({
                ...activeNote,
                content: e.target.value,
                updatedAt: new Date().toISOString(),
              });
            }}
            placeholder={t('widget.contentPlaceholder')}
            className="flex-1 w-full bg-theme-card/30 border border-white/[0.05] rounded-lg p-2.5 text-xs text-theme-text outline-none resize-none font-mono focus:border-theme-accent/50 transition-colors"
          />

          <div className="flex items-center justify-between text-[10px] text-theme-muted pt-1">
            <button
              type="button"
              onClick={() => setActiveTab('tasks')}
              className="flex items-center space-x-1 hover:text-theme-text cursor-pointer transition-colors"
            >
              <ArrowLeft size={10} />
              <span>{t('widget.tasksTab')}</span>
            </button>
            <span>{activeNote.content.length} chars</span>
          </div>
        </div>
      ) : (
        /* Checklist View (Compact & Medium Tasks Tab) */
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Quick Add Input Bar */}
          <div className="p-2 border-b border-white/[0.04] bg-theme-card/30">
            <form onSubmit={handleQuickAdd} className="flex items-center space-x-1.5">
              <input
                type="text"
                value={quickInput}
                onChange={(e) => setQuickInput(e.target.value)}
                placeholder={t('widget.quickAddPlaceholder')}
                className="flex-1 bg-theme-card px-2 py-1 rounded-md text-xs outline-none border border-white/[0.06] focus:border-theme-accent text-theme-text placeholder-theme-muted"
                autoFocus
              />
              <button
                type="submit"
                disabled={!quickInput.trim()}
                className={`p-1 rounded-md transition-colors ${
                  quickInput.trim()
                    ? 'bg-theme-accent text-white hover:bg-theme-accent-hover cursor-pointer'
                    : 'bg-theme-card text-theme-muted/40 cursor-not-allowed'
                }`}
              >
                <Plus size={12} />
              </button>
            </form>
          </div>

          {/* Pending Checklist */}
          <div className="flex-1 overflow-y-auto p-1.5 space-y-0.5">
            {pendingNotes.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center py-6 text-xs text-theme-muted">
                <span className="text-base mb-1">🎉</span>
                <span>{t('widget.noPending')}</span>
              </div>
            ) : (
              pendingNotes.map((note) => (
                <div
                  key={note.id}
                  className="group flex items-center justify-between px-2 py-1 rounded-md hover:bg-theme-hover/60 transition-colors"
                >
                  <div
                    onClick={() => onToggleComplete(note.id)}
                    className="flex items-center space-x-2 flex-1 cursor-pointer truncate mr-1"
                  >
                    <button
                      type="button"
                      className="text-theme-muted group-hover:text-theme-accent transition-colors shrink-0"
                    >
                      <Circle size={12} />
                    </button>
                    <span className="text-xs text-theme-text truncate">{note.title}</span>
                  </div>

                  {/* Open in medium note view button */}
                  <button
                    type="button"
                    onClick={() => handleOpenNote(note.id)}
                    className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-theme-card text-theme-muted hover:text-theme-text transition-all cursor-pointer shrink-0"
                    title={t('widget.expandMedium')}
                  >
                    <FileText size={11} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
