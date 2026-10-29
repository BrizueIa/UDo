import React, { useEffect, useState } from 'react';
import { ViewFilter, ThemeId, AccentColor, CustomThemeDefinition } from '../shared/types';
import { TrafficLights } from '../shared/ui/TrafficLights';
import { UDoLogo } from '../shared/ui/UDoLogo';
import { renderRichTitle } from '../features/note-sheet/utils/inlineRichTextParser';
import { SettingsModal } from './SettingsModal';
import { TopBarSearch } from './TopBarSearch';
import { TopBarFilterTabs } from './TopBarFilterTabs';
import { api, WindowEnvironment } from '../shared/api/ipc';
import {
  Layers,
  Settings,
  Timer,
  Play,
  Pause,
  PanelLeft,
  FolderTree,
  Maximize2,
  Minimize2,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
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
  audioVolume: number;
  isSidebarCollapsed?: boolean;
  isFoldersCollapsed?: boolean;
  isZenMode?: boolean;
  showBreadcrumbs?: boolean;
  onToggleBreadcrumbs?: (show: boolean) => void;
  onVolumeChange: (vol: number) => void;
  onSearchChange: (q: string) => void;
  onOpenSearchPalette: (initialQuery?: string) => void;
  onFilterChange: (f: ViewFilter) => void;
  onSelectTheme: (theme: ThemeId) => void;
  onSelectAccent: (accent: AccentColor) => void;
  onImportCustomTheme: (theme: CustomThemeDefinition) => void;
  onDeleteCustomTheme: (id: string) => void;
  onToggleLanguage?: () => void;
  onToggleShortcutsModal?: () => void;
  onToggleWidgetMode: () => void;
  onToggleAudioMute: () => void;
  onToggleSidebar?: () => void;
  onToggleFolders?: () => void;
  onToggleZenMode?: () => void;
  onOpenTimerModal?: () => void;
  hasVaultPin?: boolean;
  isVaultUnlocked?: boolean;
  onOpenPinSetup?: () => void;
  onOpenPinChange?: () => void;
  onLockVault?: () => void;
  onWorkspaceReloaded?: () => void;
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
  audioVolume,
  isSidebarCollapsed = false,
  isFoldersCollapsed = false,
  isZenMode = false,
  showBreadcrumbs = true,
  onToggleBreadcrumbs,
  onVolumeChange,
  onSearchChange,
  onOpenSearchPalette,
  onFilterChange,
  onSelectTheme,
  onSelectAccent,
  onImportCustomTheme,
  onDeleteCustomTheme,
  onToggleWidgetMode,
  onToggleAudioMute,
  onToggleSidebar,
  onToggleFolders,
  onToggleZenMode,
  onOpenTimerModal,
  hasVaultPin,
  isVaultUnlocked,
  onOpenPinSetup,
  onOpenPinChange,
  onLockVault,
  onWorkspaceReloaded,
}) => {
  const { t } = useTranslation();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [windowEnv, setWindowEnv] = useState<WindowEnvironment>({
    os: 'linux',
    desktop: '',
    controlsSide: 'right',
    showMinMax: false,
    isTilingWm: true,
  });

  useEffect(() => {
    api.getWindowEnv().then(setWindowEnv).catch(() => {});
  }, []);

  // Global Ctrl + , listener for Settings Modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === ',') {
        e.preventDefault();
        setIsSettingsOpen((p) => !p);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <header
      data-tauri-drag-region
      className="h-12 bg-theme-sidebar border-b border-theme-border flex items-center justify-between px-3 select-none flex-shrink-0 z-20 gap-2"
    >
      {/* Left: Window Controls (if left) + Column Toggles + App Title */}
      <div className="flex items-center space-x-2 shrink-0">
        {windowEnv.controlsSide === 'left' && (
          <TrafficLights showMinMax={windowEnv.showMinMax} styleMode="mac" />
        )}

        <div className="flex items-center space-x-1.5">
          {/* Column 1 Toggle (Subjects, Ctrl+B) */}
          {onToggleSidebar && (
            <button
              type="button"
              onClick={onToggleSidebar}
              className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                !isSidebarCollapsed
                  ? 'text-theme-muted hover:text-theme-text hover:bg-theme-card'
                  : 'text-theme-accent bg-theme-accent/20 hover:bg-theme-accent/30'
              }`}
              title={`${t('nav.toggleSubjects')} (Ctrl+B)`}
            >
              <PanelLeft size={14} />
            </button>
          )}

          {/* Column 2 Toggle (Folders, Ctrl+\) */}
          {onToggleFolders && (
            <button
              type="button"
              onClick={onToggleFolders}
              className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                !isFoldersCollapsed
                  ? 'text-theme-muted hover:text-theme-text hover:bg-theme-card'
                  : 'text-theme-accent bg-theme-accent/20 hover:bg-theme-accent/30'
              }`}
              title={`${t('nav.toggleFolders')} (Ctrl+\\)`}
            >
              <FolderTree size={14} />
            </button>
          )}

          {/* Zen Mode Toggle (F11) */}
          {onToggleZenMode && (
            <button
              type="button"
              onClick={onToggleZenMode}
              className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                !isZenMode
                  ? 'text-theme-muted hover:text-theme-text hover:bg-theme-card'
                  : 'text-theme-accent bg-theme-accent/20 hover:bg-theme-accent/30'
              }`}
              title={`${t('nav.toggleSidebars')} (F11)`}
            >
              {isZenMode ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
            </button>
          )}

          <UDoLogo variant="color" size={20} className="ml-1 shrink-0 drop-shadow-sm" />
          <h1 className="text-xs font-bold tracking-tight text-theme-text font-sans">
            {t('app.title')}
          </h1>

          {currentSubjectName && (
            <span className="hidden sm:inline-block px-2 py-0.5 rounded-md bg-theme-card text-[11px] font-semibold text-theme-muted border border-white/[0.05] truncate max-w-[130px]">
              {renderRichTitle(currentSubjectName)}
            </span>
          )}
        </div>
      </div>

      {/* Middle: Unified Search Bar */}
      <TopBarSearch
        searchQuery={searchQuery}
        onSearchChange={onSearchChange}
        onOpenSearchPalette={onOpenSearchPalette}
      />

      {/* Right: Filter Pills + Quick Tools */}
      <div className="flex items-center space-x-2 shrink-0">
        {/* Active Focus Sprint Timer (FR-14) */}
        {timer && (timer.isRunning || timer.isPaused) && (
          <div
            onClick={onOpenTimerModal}
            className={`hidden md:flex items-center space-x-1.5 px-2.5 py-1 rounded-lg text-xs font-mono font-semibold cursor-pointer border transition-colors shadow-sm whitespace-nowrap ${
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
              className="p-0.5 rounded hover:bg-white/10 transition-colors ml-0.5 cursor-pointer"
              title={timer.isPaused ? t('focusTimer.resume') : t('focusTimer.pause')}
            >
              {timer.isPaused ? <Play size={10} className="fill-current" /> : <Pause size={10} />}
            </button>
          </div>
        )}

        {/* Animated Filter Pills */}
        <TopBarFilterTabs
          filter={filter}
          pendingCount={pendingCount}
          completedCount={completedCount}
          totalCount={totalCount}
          onFilterChange={onFilterChange}
        />

        {/* Quick Icon Actions */}
        <div className="flex items-center space-x-1 pl-1 sm:pl-2 border-l border-white/[0.06] text-theme-muted">
          {/* Always-on-top Widget toggle */}
          <button
            type="button"
            onClick={onToggleWidgetMode}
            className="p-1.5 rounded-md hover:text-theme-text hover:bg-theme-hover transition-colors cursor-pointer"
            title={t('shortcuts.toggleWidget')}
          >
            <Layers size={15} />
          </button>

          {/* Unified Settings Modal Trigger */}
          <button
            type="button"
            onClick={() => setIsSettingsOpen(true)}
            className="p-1.5 rounded-md hover:text-theme-text hover:bg-theme-hover transition-colors cursor-pointer"
            title={`${t('settings.title')} (Ctrl+,)`}
          >
            <Settings size={15} />
          </button>

          {/* Window Controls (Native) */}
          {windowEnv.controlsSide === 'right' && (
            <div className="pl-1 sm:pl-2 ml-1 border-l border-theme-border/60 flex items-center">
              <TrafficLights showMinMax={windowEnv.showMinMax} styleMode="native" />
            </div>
          )}
        </div>
      </div>

      {/* Unified Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        currentTheme={currentTheme}
        currentAccent={currentAccent}
        customThemes={customThemes}
        onSelectTheme={onSelectTheme}
        onSelectAccent={onSelectAccent}
        onImportCustomTheme={onImportCustomTheme}
        onDeleteCustomTheme={onDeleteCustomTheme}
        isAudioMuted={isAudioMuted}
        audioVolume={audioVolume}
        onVolumeChange={onVolumeChange}
        onToggleAudioMute={onToggleAudioMute}
        showBreadcrumbs={showBreadcrumbs}
        onToggleBreadcrumbs={onToggleBreadcrumbs}
        hasVaultPin={hasVaultPin}
        isVaultUnlocked={isVaultUnlocked}
        onOpenPinSetup={onOpenPinSetup}
        onOpenPinChange={onOpenPinChange}
        onLockVault={onLockVault}
        onWorkspaceReloaded={onWorkspaceReloaded}
      />
    </header>
  );
};
