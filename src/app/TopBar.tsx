import React from 'react';
import { ViewFilter, ThemeId, AccentColor, CustomThemeDefinition } from '../shared/types';
import { TrafficLights } from '../shared/ui/TrafficLights';
import { ThemeSelectorMenu } from '../shared/ui/ThemeSelectorMenu';
import { Search, Globe, HelpCircle, Layers, X, Volume2, VolumeX, Timer, Play, Pause } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { FocusTimerState } from '../shared/hooks/useFocusTimer';

interface Props {
  currentSubjectName?: string;
  searchQuery: string;
  filter: ViewFilter;
  pendingCount: number;
  completedCount: number;
  totalCount: number;
  currentTheme: ThemeId;
  currentAccent: AccentColor;
  customThemes: CustomThemeDefinition[];
  timer?: FocusTimerState;
  isAudioMuted: boolean;
  onSearchChange: (q: string) => void;
  onOpenSearchPalette: (initialQuery?: string) => void;
  onFilterChange: (f: ViewFilter) => void;
  onSelectTheme: (theme: ThemeId) => void;
  onSelectAccent: (accent: AccentColor) => void;
  onImportCustomTheme: (theme: CustomThemeDefinition) => void;
  onDeleteCustomTheme: (id: string) => void;
  onToggleLanguage: () => void;
  onToggleShortcutsModal: () => void;
  onToggleWidgetMode: () => void;
  onToggleAudioMute: () => void;
  onOpenTimerModal?: () => void;
}

export const TopBar: React.FC<Props> = ({
  currentSubjectName,
  searchQuery,
  filter,
  pendingCount,
  completedCount,
  totalCount,
  currentTheme,
  currentAccent,
  customThemes,
  timer,
  isAudioMuted,
  onSearchChange,
  onOpenSearchPalette,
  onFilterChange,
  onSelectTheme,
  onSelectAccent,
  onImportCustomTheme,
  onDeleteCustomTheme,
  onToggleLanguage,
  onToggleShortcutsModal,
  onToggleWidgetMode,
  onToggleAudioMute,
  onOpenTimerModal,
}) => {
  const { t, i18n } = useTranslation();
  const searchInputRef = React.useRef<HTMLInputElement>(null);

  // Global Ctrl + Shift + F listener to focus & select active category search bar (FR-06)
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'f') {
        e.preventDefault();
        searchInputRef.current?.focus();
        searchInputRef.current?.select();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const filterTabs = [
    { id: 'all', label: `${t('nav.filterAll')} (${totalCount})` },
    { id: 'pending', label: `${t('nav.filterPending')} (${pendingCount})` },
    { id: 'completed', label: `${t('nav.filterCompleted')} (${completedCount})` },
  ];

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      onSearchChange('');
      searchInputRef.current?.blur();
    } else if (e.key === 'Enter') {
      onOpenSearchPalette(searchQuery);
    }
  };

  return (
    <header
      data-tauri-drag-region
      className="h-12 bg-theme-sidebar border-b border-theme-border flex items-center justify-between px-3 select-none flex-shrink-0 z-20"
    >
      {/* Left: Window Traffic Lights + App Title + Current Project Badge */}
      <div className="flex items-center space-x-3">
        <TrafficLights />

        <div className="flex items-center space-x-2">
          <span className="w-2.5 h-2.5 rounded-full bg-theme-accent shadow-sm" />
          <h1 className="text-xs font-bold tracking-tight text-theme-text font-sans">
            {t('app.title')}
          </h1>

          {currentSubjectName && (
            <span className="px-2 py-0.5 rounded-md bg-theme-card text-[11px] font-semibold text-theme-muted border border-white/[0.05]">
              {currentSubjectName}
            </span>
          )}
        </div>
      </div>

      {/* Middle: Unified Search Bar with Real-time Filtering & Quick Ctrl+K Palette */}
      <div className="flex-1 max-w-md mx-4">
        <div className="relative flex items-center group">
          <Search
            size={14}
            className="absolute left-3 text-theme-muted group-hover:text-theme-accent transition-colors pointer-events-none"
          />
          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            onKeyDown={handleSearchKeyDown}
            placeholder={t('nav.searchPlaceholder')}
            className="w-full bg-theme-card/70 hover:bg-theme-card focus:bg-theme-card text-xs text-theme-text placeholder-theme-muted pl-8 pr-16 py-1.5 rounded-lg outline-none border border-white/[0.06] hover:border-theme-accent/40 focus:border-theme-accent/60 transition-all shadow-inner"
          />
          <div className="absolute right-2.5 flex items-center space-x-1">
            {searchQuery && (
              <button
                type="button"
                onClick={() => onSearchChange('')}
                className="text-theme-muted hover:text-theme-text p-0.5"
                title={t('nav.clearSearch')}
              >
                <X size={12} />
              </button>
            )}
            <button
              type="button"
              onClick={() => onOpenSearchPalette(searchQuery)}
              className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-theme-hover text-theme-muted border border-white/[0.06] hover:border-theme-accent/40 hover:text-theme-text transition-colors cursor-pointer"
              title="Ctrl + K"
            >
              Ctrl K
            </button>
          </div>
        </div>
      </div>

      {/* Right: Filter Pills + Quick Tools */}
      <div className="flex items-center space-x-3">
        {/* Active Focus Sprint Timer (FR-14) */}
        {timer && (timer.isRunning || timer.isPaused) && (
          <div
            onClick={onOpenTimerModal}
            className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-lg text-xs font-mono font-semibold cursor-pointer border transition-colors shadow-sm ${
              timer.isPaused
                ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                : 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
            }`}
            title={
              timer.noteTitle
                ? `${timer.noteTitle} (${
                    timer.isPaused ? t('focusTimer.paused') : t('focusTimer.running')
                  })`
                : t('focusTimer.title')
            }
          >
            <Timer size={13} className={timer.isPaused ? '' : 'animate-pulse text-emerald-400'} />
            <span>{timer.formattedTime}</span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                if (timer.isPaused) {
                  timer.resumeSprint();
                } else {
                  timer.pauseSprint();
                }
              }}
              className="p-0.5 rounded hover:bg-white/10 transition-colors ml-0.5"
              title={timer.isPaused ? t('focusTimer.resume') : t('focusTimer.pause')}
            >
              {timer.isPaused ? <Play size={10} className="fill-current" /> : <Pause size={10} />}
            </button>
          </div>
        )}

        {/* Animated Filter Pills */}
        <div className="flex items-center bg-theme-column/80 p-0.5 rounded-lg border border-white/[0.05] text-xs font-medium">
          {filterTabs.map((tab) => {
            const isSelected = filter === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onFilterChange(tab.id as ViewFilter)}
                className={`relative px-2.5 py-1 rounded-md transition-colors ${
                  isSelected ? 'text-white font-semibold' : 'text-theme-muted hover:text-theme-text'
                }`}
              >
                {isSelected && (
                  <motion.div
                    layoutId="topbar-active-filter"
                    className="absolute inset-0 bg-theme-accent rounded-md shadow-sm"
                    transition={{ type: 'spring', stiffness: 450, damping: 32 }}
                  />
                )}
                <span className="relative z-10 text-[11px]">{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Quick Icon Actions */}
        <div className="flex items-center space-x-1 pl-2 border-l border-white/[0.06] text-theme-muted">
          {/* Always-on-top Widget toggle */}
          <button
            onClick={onToggleWidgetMode}
            className="p-1.5 rounded-md hover:text-theme-text hover:bg-theme-hover transition-colors"
            title={t('shortcuts.toggleWidget')}
          >
            <Layers size={15} />
          </button>

          {/* Audio Feedback Mute / Unmute (FR-15) */}
          <button
            onClick={onToggleAudioMute}
            className={`p-1.5 rounded-md transition-colors ${
              isAudioMuted
                ? 'text-theme-muted/60 hover:text-theme-text hover:bg-theme-hover'
                : 'text-theme-accent hover:text-theme-accent-hover hover:bg-theme-hover'
            }`}
            title={isAudioMuted ? t('audio.unmute') : t('audio.mute')}
          >
            {isAudioMuted ? <VolumeX size={15} /> : <Volume2 size={15} />}
          </button>

          {/* Extracted Theme & VS Code Selector Menu */}
          <ThemeSelectorMenu
            currentTheme={currentTheme}
            currentAccent={currentAccent}
            customThemes={customThemes}
            onSelectTheme={onSelectTheme}
            onSelectAccent={onSelectAccent}
            onImportCustomTheme={onImportCustomTheme}
            onDeleteCustomTheme={onDeleteCustomTheme}
          />

          {/* Language Switcher */}
          <button
            onClick={onToggleLanguage}
            className="flex items-center space-x-1 p-1.5 rounded-md hover:text-theme-text hover:bg-theme-hover transition-colors text-xs font-mono"
            title={t('settings.language')}
          >
            <Globe size={14} />
            <span className="uppercase text-[10px] font-bold">
              {i18n.language.startsWith('es') ? 'ES' : 'EN'}
            </span>
          </button>

          {/* Keyboard Shortcuts Modal */}
          <button
            onClick={onToggleShortcutsModal}
            className="p-1.5 rounded-md hover:text-theme-text hover:bg-theme-hover transition-colors"
            title={t('shortcuts.title')}
          >
            <HelpCircle size={15} />
          </button>
        </div>
      </div>
    </header>
  );
};
