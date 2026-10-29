import React, { useState, useRef, useEffect } from 'react';
import { NoteItem, FolderItem, SubjectItem } from '../../../shared/types';
import { FocusTimerState } from '../../../shared/hooks/useFocusTimer';
import {
  Maximize2,
  ChevronDown,
  ChevronUp,
  Plus,
  Timer,
  Mic,
  Folder as FolderIcon,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { api } from '../../../shared/api/ipc';
import { UDoLogo } from '../../../shared/ui/UDoLogo';
import { FloatingWidgetSelectors } from './FloatingWidgetSelectors';
import { renderRichTitle } from '../../note-sheet/utils/inlineRichTextParser';

interface Props {
  notes: NoteItem[];
  subjects: SubjectItem[];
  folders: FolderItem[];
  selectedSubjectId: string;
  selectedFolderId: string;
  timer?: FocusTimerState;
  onSelectSubject: (id: string) => void;
  onSelectFolder: (id: string) => void;
  onToggleComplete: (id: string) => void;
  onQuickAddNote: (title: string, folderId: string, subjectId?: string) => void;
  onOpenNoteInFullApp: (noteId: string, subjectId: string, folderId: string) => void;
  onRestoreFullApp: () => void;
}

export const FloatingWidget: React.FC<Props> = ({
  notes,
  subjects,
  folders,
  selectedSubjectId,
  selectedFolderId,
  timer,
  onSelectSubject,
  onSelectFolder,
  onToggleComplete,
  onQuickAddNote,
  onOpenNoteInFullApp,
  onRestoreFullApp,
}) => {
  const { t } = useTranslation();
  const [isExpanded, setIsExpanded] = useState(false);
  const [quickInput, setQuickInput] = useState('');
  const [activeSubjectId, setActiveSubjectId] = useState(selectedSubjectId || subjects[0]?.id || '');
  const [activeFolderId, setActiveFolderId] = useState(selectedFolderId || folders[0]?.id || '');

  const [showSubjectMenu, setShowSubjectMenu] = useState(false);
  const [showFolderMenu, setShowFolderMenu] = useState(false);

  const subjectMenuRef = useRef<HTMLDivElement>(null);
  const folderMenuRef = useRef<HTMLDivElement>(null);

  const currentSubject = subjects.find((s) => s.id === activeSubjectId) || subjects[0];
  const projectFolders = folders.filter((f) => f.subjectId === (currentSubject?.id || activeSubjectId));
  const currentFolder = projectFolders.find((f) => f.id === activeFolderId) || projectFolders[0];

  useEffect(() => {
    if (activeFolderId && !projectFolders.some((f) => f.id === activeFolderId)) {
      setActiveFolderId(projectFolders[0]?.id || '');
    }
  }, [projectFolders, activeFolderId]);

  // Filter notes strictly by selected folder
  const folderPendingNotes = currentFolder
    ? notes.filter((n) => !n.isCompleted && n.folderId === currentFolder.id)
    : [];

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (subjectMenuRef.current && !subjectMenuRef.current.contains(e.target as Node)) {
        setShowSubjectMenu(false);
      }
      if (folderMenuRef.current && !folderMenuRef.current.contains(e.target as Node)) {
        setShowFolderMenu(false);
      }
    };
    if (showSubjectMenu || showFolderMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showSubjectMenu, showFolderMenu]);

  const handleToggleExpand = (next: boolean) => {
    setIsExpanded(next);
    api.setWidgetSize(next ? 'expanded' : 'compact');
  };

  const handleSelectSubject = (id: string) => {
    setActiveSubjectId(id);
    onSelectSubject(id);
    setShowSubjectMenu(false);
    const firstF = folders.find((f) => f.subjectId === id);
    setActiveFolderId(firstF ? firstF.id : '');
    if (firstF) {
      onSelectFolder(firstF.id);
    }
  };

  const handleSelectFolder = (id: string) => {
    setActiveFolderId(id);
    onSelectFolder(id);
    setShowFolderMenu(false);
  };

  const handleQuickAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickInput.trim()) return;
    onQuickAddNote(quickInput.trim(), currentFolder ? currentFolder.id : '', activeSubjectId);
    setQuickInput('');
  };

  // State 1: Ultra-compact Pill in Screen Corner (240x52)
  if (!isExpanded) {
    return (
      <div
        data-tauri-drag-region
        className="w-full h-full flex items-center justify-between px-3 py-1.5 bg-theme-sidebar/95 border border-white/[0.1] rounded-2xl shadow-2xl select-none cursor-move"
      >
        <div
          data-tauri-drag-region
          onClick={() => handleToggleExpand(true)}
          className="flex items-center space-x-2 cursor-pointer"
        >
          <UDoLogo variant="color" size={18} className="shrink-0 drop-shadow-sm" />
          <span className="text-xs font-bold text-theme-text font-sans tracking-tight">
            {t('app.title')}
          </span>

          {timer && (timer.isRunning || timer.isPaused) ? (
            <span className="flex items-center space-x-1 px-1.5 py-0.5 rounded-md bg-emerald-500/20 text-emerald-400 font-mono text-[10px]">
              <Timer size={10} className={timer.isRunning ? 'animate-pulse' : ''} />
              <span>{timer.formattedTime}</span>
            </span>
          ) : (
            <span className="px-1.5 py-0.5 rounded-md bg-theme-accent/20 text-theme-accent font-mono text-[10px] font-semibold">
              {folderPendingNotes.length}
            </span>
          )}
        </div>

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

  // State 2: Expanded Quick Workstation Panel (370x310)
  return (
    <div className="w-full h-full flex flex-col bg-theme-sidebar border border-white/[0.1] rounded-2xl shadow-2xl select-none overflow-hidden">
      {/* Draggable Header */}
      <div
        data-tauri-drag-region
        className="flex items-center justify-between px-3 py-2 bg-theme-base/90 border-b border-white/[0.06] cursor-move shrink-0"
      >
        <div className="flex items-center space-x-2" data-tauri-drag-region>
          <UDoLogo variant="color" size={16} className="shrink-0 drop-shadow-sm" />
          <span className="text-xs font-bold text-theme-text font-sans tracking-tight">
            {t('widget.title')}
          </span>
          <span className="px-1.5 py-0.5 rounded-md bg-theme-accent/20 text-theme-accent font-mono text-[10px] font-semibold">
            {folderPendingNotes.length}
          </span>
        </div>

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

      {/* Project Selector & Folder Selector Bar */}
      <div className="px-2.5 py-1.5 bg-theme-card/30 border-b border-white/[0.04] flex items-center justify-between text-xs space-x-1.5">
        <FloatingWidgetSelectors
          subjects={subjects}
          projectFolders={projectFolders}
          currentSubject={currentSubject}
          currentFolder={currentFolder}
          activeSubjectId={activeSubjectId}
          activeFolderId={activeFolderId}
          showSubjectMenu={showSubjectMenu}
          showFolderMenu={showFolderMenu}
          subjectMenuRef={subjectMenuRef}
          folderMenuRef={folderMenuRef}
          onToggleSubjectMenu={() => setShowSubjectMenu(!showSubjectMenu)}
          onToggleFolderMenu={() => setShowFolderMenu(!showFolderMenu)}
          onSelectSubject={handleSelectSubject}
          onSelectFolder={handleSelectFolder}
        />

        {/* Audio Note Placeholder Button */}
        <button
          type="button"
          onClick={() => {}}
          className="p-1 rounded-md bg-theme-card/60 hover:bg-theme-hover text-theme-muted hover:text-theme-accent transition-colors cursor-pointer shrink-0"
          title={t('widget.recordAudio')}
        >
          <Mic size={12} />
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

      {/* Pending Tasks List strictly filtered by selected folder */}
      <div className="flex-1 overflow-y-auto p-1.5 space-y-0.5">
        {projectFolders.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-6 text-xs text-theme-muted">
            <FolderIcon size={20} className="mb-1 text-theme-muted/40" />
            <span>{t('folders.empty')}</span>
          </div>
        ) : folderPendingNotes.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-6 text-xs text-theme-muted">
            <span className="text-base mb-1">🎉</span>
            <span>{t('widget.noPending')}</span>
          </div>
        ) : (
          folderPendingNotes.map((note) => (
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
                  <div className="w-3.5 h-3.5 rounded-[4px] border border-theme-muted/60 group-hover:border-theme-accent transition-colors" />
                </button>
                <span className="text-xs text-theme-text truncate">{renderRichTitle(note.title)}</span>
              </div>

              {/* Click to open note in full app with all panels visible */}
              <button
                type="button"
                onClick={() => onOpenNoteInFullApp(note.id, note.subjectId, note.folderId)}
                className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-theme-card text-theme-muted hover:text-theme-text transition-all cursor-pointer shrink-0"
                title={t('widget.expand')}
              >
                <Maximize2 size={11} />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
