import React, { useState, useRef, useEffect } from 'react';
import { NoteItem, FolderItem } from '../../../shared/types';
import { FocusTimerState } from '../../../shared/hooks/useFocusTimer';
import {
  Circle,
  Maximize2,
  ChevronDown,
  ChevronUp,
  Plus,
  Timer,
  Mic,
  Folder as FolderIcon,
  Check,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { api } from '../../../shared/api/ipc';

interface Props {
  notes: NoteItem[];
  folders: FolderItem[];
  defaultFolderId: string;
  timer?: FocusTimerState;
  onToggleComplete: (id: string) => void;
  onQuickAddNote: (title: string, folderId: string) => void;
  onUpdateNote?: (note: NoteItem) => void;
  onRestoreFullApp: () => void;
}

export const FloatingWidget: React.FC<Props> = ({
  notes,
  folders,
  defaultFolderId,
  timer,
  onToggleComplete,
  onQuickAddNote,
  onRestoreFullApp,
}) => {
  const { t } = useTranslation();
  const [isExpanded, setIsExpanded] = useState(false);
  const [quickInput, setQuickInput] = useState('');
  const [selectedFolderId, setSelectedFolderId] = useState<string>(
    defaultFolderId || (folders[0] ? folders[0].id : '')
  );
  const [showFolderMenu, setShowFolderMenu] = useState(false);
  const folderMenuRef = useRef<HTMLDivElement>(null);

  const pendingNotes = notes.filter((n) => !n.isCompleted);
  const activeFolder = folders.find((f) => f.id === selectedFolderId) || folders[0];

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (folderMenuRef.current && !folderMenuRef.current.contains(e.target as Node)) {
        setShowFolderMenu(false);
      }
    };
    if (showFolderMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showFolderMenu]);

  const handleToggleExpand = (next: boolean) => {
    setIsExpanded(next);
    api.setWidgetSize(next ? 'expanded' : 'compact');
  };

  const handleQuickAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickInput.trim()) return;
    onQuickAddNote(quickInput.trim(), selectedFolderId);
    setQuickInput('');
  };

  // State 1: Ultra-compact Pill in Screen Corner (240x52)
  if (!isExpanded) {
    return (
      <div
        data-tauri-drag-region
        className="w-full h-full flex items-center justify-between px-3 py-1.5 bg-theme-sidebar/95 border border-white/[0.1] rounded-2xl shadow-2xl select-none cursor-move"
      >
        {/* Left: Logo & App Brand */}
        <div
          data-tauri-drag-region
          onClick={() => handleToggleExpand(true)}
          className="flex items-center space-x-2 cursor-pointer"
        >
          <span className="w-2.5 h-2.5 rounded-full bg-theme-accent shadow-sm animate-pulse" />
          <span className="text-xs font-bold text-theme-text font-sans tracking-tight">
            {t('app.title')}
          </span>

          {/* Timer status or Pending count */}
          {timer && (timer.isRunning || timer.isPaused) ? (
            <span className="flex items-center space-x-1 px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-mono text-[10px]">
              <Timer size={10} className={timer.isRunning ? 'animate-pulse' : ''} />
              <span>{timer.formattedTime}</span>
            </span>
          ) : (
            <span className="px-1.5 py-0.5 rounded-full bg-theme-accent/20 text-theme-accent font-mono text-[10px] font-semibold">
              {pendingNotes.length}
            </span>
          )}
        </div>

        {/* Right: Expand & Restore Actions */}
        <div className="flex items-center space-x-1" data-tauri-drag-region="false">
          <button
            type="button"
            onClick={() => handleToggleExpand(true)}
            className="p-1.5 rounded-lg text-theme-muted hover:text-theme-text hover:bg-theme-card transition-colors cursor-pointer"
            title={t('widget.expandToPanel')}
          >
            <ChevronDown size={14} />
          </button>
          <button
            type="button"
            onClick={onRestoreFullApp}
            className="p-1.5 rounded-lg text-theme-muted hover:text-theme-text hover:bg-theme-card transition-colors cursor-pointer"
            title={t('widget.expand')}
          >
            <Maximize2 size={12} />
          </button>
        </div>
      </div>
    );
  }

  // State 2: Expanded Quick Workstation Panel (360x290)
  return (
    <div className="w-full h-full flex flex-col bg-theme-sidebar border border-white/[0.1] rounded-2xl shadow-2xl select-none overflow-hidden">
      {/* Draggable Header */}
      <div
        data-tauri-drag-region
        className="flex items-center justify-between px-3 py-2 bg-theme-base/90 border-b border-white/[0.06] cursor-move shrink-0"
      >
        <div className="flex items-center space-x-2" data-tauri-drag-region>
          <span className="w-2 h-2 rounded-full bg-theme-accent" />
          <span className="text-xs font-bold text-theme-text font-sans tracking-tight">
            {t('widget.title')}
          </span>
          <span className="px-1.5 py-0.5 rounded-full bg-theme-accent/20 text-theme-accent font-mono text-[10px] font-semibold">
            {pendingNotes.length}
          </span>
        </div>

        {/* Header Controls */}
        <div className="flex items-center space-x-1" data-tauri-drag-region="false">
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

          <button
            type="button"
            onClick={() => handleToggleExpand(false)}
            className="p-1 rounded text-theme-muted hover:text-theme-text hover:bg-theme-card transition-colors cursor-pointer"
            title={t('widget.collapseToPill')}
          >
            <ChevronUp size={13} />
          </button>

          <button
            type="button"
            onClick={onRestoreFullApp}
            className="p-1 rounded text-theme-muted hover:text-theme-text hover:bg-theme-card transition-colors cursor-pointer"
            title={t('widget.expand')}
          >
            <Maximize2 size={12} />
          </button>
        </div>
      </div>

      {/* Folder Picker & Audio Note Placeholder Bar */}
      <div className="px-3 py-1.5 bg-theme-card/30 border-b border-white/[0.04] flex items-center justify-between text-xs">
        {/* Folder Dropdown */}
        <div className="relative" ref={folderMenuRef}>
          <button
            type="button"
            onClick={() => setShowFolderMenu(!showFolderMenu)}
            className="flex items-center space-x-1 px-2 py-0.5 rounded-md bg-theme-card border border-white/[0.06] hover:bg-theme-hover text-theme-text transition-colors cursor-pointer text-[11px]"
            title={t('widget.chooseFolder')}
          >
            <FolderIcon size={11} className="text-amber-400" />
            <span className="truncate max-w-[130px]">
              {activeFolder ? activeFolder.name : t('widget.chooseFolder')}
            </span>
            <ChevronDown size={10} className="text-theme-muted" />
          </button>

          {showFolderMenu && (
            <div className="absolute top-full left-0 mt-1 w-44 bg-theme-card border border-white/[0.08] rounded-xl shadow-2xl py-1 z-30 max-h-36 overflow-y-auto">
              {folders.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => {
                    setSelectedFolderId(f.id);
                    setShowFolderMenu(false);
                  }}
                  className={`w-full text-left px-2.5 py-1 text-[11px] flex items-center justify-between hover:bg-theme-hover transition-colors ${
                    f.id === selectedFolderId ? 'text-theme-accent font-semibold' : 'text-theme-text'
                  }`}
                >
                  <span className="truncate">{f.name}</span>
                  {f.id === selectedFolderId && <Check size={11} />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Audio Note Placeholder Button */}
        <button
          type="button"
          onClick={() => {}}
          className="flex items-center space-x-1 px-2 py-0.5 rounded-md bg-theme-card/60 hover:bg-theme-hover text-theme-muted hover:text-theme-accent transition-colors text-[11px] cursor-pointer"
          title={t('widget.recordAudio')}
        >
          <Mic size={11} />
          <span>{t('widget.recordAudio')}</span>
        </button>
      </div>

      {/* Quick Input Bar */}
      <div className="p-2 border-b border-white/[0.04]">
        <form onSubmit={handleQuickAdd} className="flex items-center space-x-1.5">
          <input
            type="text"
            value={quickInput}
            onChange={(e) => setQuickInput(e.target.value)}
            placeholder={t('widget.quickAddPlaceholder')}
            className="flex-1 bg-theme-card px-2.5 py-1 rounded-md text-xs outline-none border border-white/[0.06] focus:border-theme-accent text-theme-text placeholder-theme-muted"
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

      {/* Pending Tasks List */}
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
              onClick={() => onToggleComplete(note.id)}
              className="group flex items-center space-x-2 px-2 py-1 rounded-md hover:bg-theme-hover/60 cursor-pointer transition-colors"
            >
              <button
                type="button"
                className="text-theme-muted group-hover:text-theme-accent transition-colors shrink-0"
              >
                <Circle size={12} />
              </button>
              <span className="text-xs text-theme-text truncate flex-1">{note.title}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
