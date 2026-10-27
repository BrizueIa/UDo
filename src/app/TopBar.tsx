import React from 'react';
import { ViewFilter, ThemeId } from '../shared/types';
import { TrafficLights } from '../shared/ui/TrafficLights';
import { Search, Palette, Globe, HelpCircle, Layers } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';

interface Props {
  currentSubjectName?: string;
  searchQuery: string;
  filter: ViewFilter;
  pendingCount: number;
  completedCount: number;
  totalCount: number;
  currentTheme: ThemeId;
  onSearchChange: (q: string) => void;
  onFilterChange: (f: ViewFilter) => void;
  onToggleTheme: () => void;
  onToggleLanguage: () => void;
  onToggleShortcutsModal: () => void;
  onToggleWidgetMode: () => void;
}

export const TopBar: React.FC<Props> = ({
  currentSubjectName,
  searchQuery,
  filter,
  pendingCount,
  completedCount,
  totalCount,
  onSearchChange,
  onFilterChange,
  onToggleTheme,
  onToggleLanguage,
  onToggleShortcutsModal,
  onToggleWidgetMode,
}) => {
  const { t, i18n } = useTranslation();

  const filterTabs = [
    { id: 'all', label: `${t('nav.filterAll')} (${totalCount})` },
    { id: 'pending', label: `${t('nav.filterPending')} (${pendingCount})` },
    { id: 'completed', label: `${t('nav.filterCompleted')} (${completedCount})` },
  ];

  return (
    <header className="h-12 bg-theme-sidebar border-b border-theme-border flex items-center justify-between px-3 select-none flex-shrink-0 z-20">
      {/* Left: Window Traffic Lights + App Title + Current Project Badge */}
      <div className="flex items-center space-x-3">
        <TrafficLights />

        <div className="flex items-center space-x-2">
          <span className="w-2.5 h-2.5 rounded-full bg-theme-accent shadow-sm" />
          <h1 className="text-xs font-bold tracking-tight text-theme-text font-sans">
            UDo
          </h1>

          {currentSubjectName && (
            <span className="px-2 py-0.5 rounded-md bg-theme-card text-[11px] font-semibold text-theme-muted border border-theme-border/60">
              {currentSubjectName}
            </span>
          )}
        </div>
      </div>

      {/* Middle: Integrated Search Bar (Ctrl+K) */}
      <div className="flex-1 max-w-md mx-4">
        <div className="relative flex items-center">
          <Search size={14} className="absolute left-3 text-theme-muted pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={t('nav.searchPlaceholder')}
            className="w-full bg-theme-card/70 hover:bg-theme-card focus:bg-theme-card text-xs text-theme-text placeholder-theme-muted pl-8 pr-12 py-1.5 rounded-lg outline-none border border-theme-border focus:border-theme-accent/60 transition-all shadow-inner"
          />
          <kbd className="absolute right-2.5 text-[10px] font-mono px-1.5 py-0.5 rounded bg-theme-hover text-theme-muted border border-theme-border/50">
            Ctrl K
          </kbd>
        </div>
      </div>

      {/* Right: Filter Pills + Quick Tools */}
      <div className="flex items-center space-x-3">
        {/* Animated Filter Pills */}
        <div className="flex items-center bg-theme-column/80 p-0.5 rounded-lg border border-theme-border/60 text-xs font-medium">
          {filterTabs.map((tab) => {
            const isSelected = filter === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onFilterChange(tab.id as ViewFilter)}
                className={`relative px-3 py-1 rounded-md transition-colors ${
                  isSelected ? 'text-white' : 'text-theme-muted hover:text-theme-text'
                }`}
              >
                {isSelected && (
                  <motion.div
                    layoutId="topbar-active-filter"
                    className="absolute inset-0 bg-theme-accent rounded-md shadow-sm"
                    transition={{ type: 'spring', bounce: 0.2, duration: 0.3 }}
                  />
                )}
                <span className="relative z-10 text-[11px]">{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Quick Icon Actions */}
        <div className="flex items-center space-x-1 pl-2 border-l border-theme-border/50 text-theme-muted">
          {/* Always-on-top Widget toggle */}
          <button
            onClick={onToggleWidgetMode}
            className="p-1.5 rounded-md hover:text-theme-text hover:bg-theme-hover transition-colors"
            title={t('shortcuts.toggleWidget')}
          >
            <Layers size={15} />
          </button>

          {/* Theme Cycler */}
          <button
            onClick={onToggleTheme}
            className="p-1.5 rounded-md hover:text-theme-text hover:bg-theme-hover transition-colors"
            title={t('settings.theme')}
          >
            <Palette size={15} />
          </button>

          {/* Language Cycler (EN <-> ES) */}
          <button
            onClick={onToggleLanguage}
            className="p-1.5 rounded-md hover:text-theme-text hover:bg-theme-hover transition-colors text-[11px] font-mono font-bold"
            title={t('settings.language')}
          >
            <span className="flex items-center space-x-1">
              <Globe size={13} />
              <span>{i18n.language.toUpperCase()}</span>
            </span>
          </button>

          {/* Shortcut Help Modal */}
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
