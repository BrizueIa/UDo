import React, { useState, useEffect } from 'react';
import { ThemeId, AccentColor, CustomThemeDefinition } from '../types';
import { Check, Trash2, Moon, Sun, Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { parseVSCodeTheme } from '../utils/themeImporter';
import { PRESET_THEMES, ACCENTS } from '../data/themePresets';
import { ThemeImporterTab } from './ThemeImporterTab';

interface Props {
  currentTheme: ThemeId;
  currentAccent: AccentColor;
  customThemes: CustomThemeDefinition[];
  onSelectTheme: (theme: ThemeId) => void;
  onSelectAccent: (accent: AccentColor) => void;
  onImportCustomTheme: (theme: CustomThemeDefinition) => void;
  onDeleteCustomTheme: (id: string) => void;
  onCloseMenu?: () => void;
}

export const ThemeSettingsPanel: React.FC<Props> = ({
  currentTheme,
  currentAccent,
  customThemes,
  onSelectTheme,
  onSelectAccent,
  onImportCustomTheme,
  onDeleteCustomTheme,
  onCloseMenu,
}) => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'presets' | 'accent' | 'import'>('presets');
  const [themeCategoryFilter, setThemeCategoryFilter] = useState<'all' | 'dark' | 'light'>('all');
  const [importJsonText, setImportJsonText] = useState('');
  const [importError, setImportError] = useState<string | null>(null);

  // Restore current theme on unmount
  useEffect(() => {
    return () => {
      document.documentElement.setAttribute('data-theme', currentTheme);
    };
  }, [currentTheme]);

  const restoreTheme = () => {
    document.documentElement.setAttribute('data-theme', currentTheme);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      try {
        const theme = parseVSCodeTheme(content, file.name.replace(/\.json$/i, ''));
        onImportCustomTheme(theme);
        setImportError(null);
        setActiveTab('presets');
      } catch (err: any) {
        setImportError(err.message || 'Error parsing theme file');
      }
    };
    reader.readAsText(file);
  };

  const handleTextImport = () => {
    if (!importJsonText.trim()) return;
    try {
      const theme = parseVSCodeTheme(importJsonText);
      onImportCustomTheme(theme);
      setImportJsonText('');
      setImportError(null);
      setActiveTab('presets');
    } catch (err: any) {
      setImportError(err.message || 'Error parsing theme json');
    }
  };

  const darkPresets = PRESET_THEMES.filter((th) => th.category === 'dark');
  const lightPresets = PRESET_THEMES.filter((th) => th.category === 'light');

  return (
    <div className="space-y-3" onMouseLeave={restoreTheme}>
      {/* Subtabs Header */}
      <div className="flex items-center bg-theme-column/80 p-0.5 rounded-lg text-xs font-semibold w-fit">
        <button
          type="button"
          onClick={() => setActiveTab('presets')}
          className={`px-3 py-1 rounded-md transition-colors cursor-pointer ${
            activeTab === 'presets'
              ? 'bg-theme-accent text-white shadow-xs'
              : 'text-theme-muted hover:text-theme-text'
          }`}
        >
          {t('settings.themes')} ({PRESET_THEMES.length + customThemes.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('accent')}
          className={`px-3 py-1 rounded-md transition-colors cursor-pointer ${
            activeTab === 'accent'
              ? 'bg-theme-accent text-white shadow-xs'
              : 'text-theme-muted hover:text-theme-text'
          }`}
        >
          {t('settings.accent')}
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('import')}
          className={`px-3 py-1 rounded-md transition-colors cursor-pointer ${
            activeTab === 'import'
              ? 'bg-theme-accent text-white shadow-xs'
              : 'text-theme-muted hover:text-theme-text'
          }`}
        >
          {t('settings.customTab')}
        </button>
      </div>

      {/* Tab 1: Presets & Custom Themes */}
      {activeTab === 'presets' && (
        <div className="space-y-3">
          {/* Category Filter Pills */}
          <div className="flex items-center space-x-1 p-0.5 bg-theme-column/60 rounded-lg text-[11px] font-medium w-full">
            <button
              type="button"
              onClick={() => setThemeCategoryFilter('all')}
              className={`flex-1 py-1 rounded text-center transition-colors cursor-pointer ${
                themeCategoryFilter === 'all'
                  ? 'bg-theme-card text-theme-text font-semibold shadow-xs'
                  : 'text-theme-muted hover:text-theme-text'
              }`}
            >
              {t('settings.allThemes')} ({PRESET_THEMES.length})
            </button>
            <button
              type="button"
              onClick={() => setThemeCategoryFilter('dark')}
              className={`flex-1 py-1 rounded text-center transition-colors cursor-pointer flex items-center justify-center space-x-1.5 ${
                themeCategoryFilter === 'dark'
                  ? 'bg-theme-card text-theme-text font-semibold shadow-xs'
                  : 'text-theme-muted hover:text-theme-text'
              }`}
            >
              <Moon size={12} />
              <span>{t('settings.darkThemes')}</span>
              <span className="opacity-70 font-mono text-[10px]">({darkPresets.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setThemeCategoryFilter('light')}
              className={`flex-1 py-1 rounded text-center transition-colors cursor-pointer flex items-center justify-center space-x-1.5 ${
                themeCategoryFilter === 'light'
                  ? 'bg-theme-card text-theme-text font-semibold shadow-xs'
                  : 'text-theme-muted hover:text-theme-text'
              }`}
            >
              <Sun size={12} />
              <span>{t('settings.lightThemes')}</span>
              <span className="opacity-70 font-mono text-[10px]">({lightPresets.length})</span>
            </button>
          </div>

          {/* Theme List Grid */}
          <div className="max-h-[360px] overflow-y-auto space-y-3.5 pr-1.5" onMouseLeave={restoreTheme}>
            {(themeCategoryFilter === 'all' || themeCategoryFilter === 'dark') && (
              <div className="space-y-1.5">
                <div className="flex items-center space-x-2 px-1 text-[11px] font-bold text-theme-muted uppercase tracking-wider">
                  <div className="flex items-center space-x-1.5">
                    <Moon size={11} className="text-theme-muted" />
                    <span>{t('settings.darkThemes')}</span>
                  </div>
                  <div className="flex-1 h-px bg-white/[0.06]" />
                  <span className="text-[10px] font-mono opacity-60">{darkPresets.length}</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {darkPresets.map((th) => {
                    const isSelected = currentTheme === th.id;
                    return (
                      <button
                        key={th.id}
                        type="button"
                        onClick={() => {
                          onSelectTheme(th.id);
                          onCloseMenu?.();
                        }}
                        onMouseEnter={() => document.documentElement.setAttribute('data-theme', th.id)}
                        onMouseLeave={restoreTheme}
                        className={`flex items-center justify-between p-2.5 rounded-xl text-xs transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-theme-card text-theme-text font-semibold border border-theme-accent/60 shadow-sm ring-1 ring-theme-accent/20'
                            : 'bg-theme-card/50 hover:bg-theme-card text-theme-muted hover:text-theme-text border border-white/[0.05] hover:border-theme-accent/30'
                        }`}
                      >
                        <span className="truncate font-medium">{th.name}</span>
                        <div className="flex items-center space-x-2 shrink-0">
                          <div className="flex items-center space-x-1 px-1.5 py-0.5 rounded-md bg-theme-base/60 border border-white/[0.04]">
                            {th.previewColors.map((color, idx) => (
                              <span
                                key={idx}
                                className="w-2.5 h-2.5 rounded-[3px] border border-black/30 shadow-xs"
                                style={{ backgroundColor: color }}
                              />
                            ))}
                          </div>
                          {isSelected && <Check size={14} className="text-theme-accent shrink-0 ml-1" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {(themeCategoryFilter === 'all' || themeCategoryFilter === 'light') && (
              <div className="space-y-1.5 pt-1">
                <div className="flex items-center space-x-2 px-1 text-[11px] font-bold text-theme-muted uppercase tracking-wider">
                  <div className="flex items-center space-x-1.5">
                    <Sun size={11} className="text-theme-muted" />
                    <span>{t('settings.lightThemes')}</span>
                  </div>
                  <div className="flex-1 h-px bg-white/[0.06]" />
                  <span className="text-[10px] font-mono opacity-60">{lightPresets.length}</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {lightPresets.map((th) => {
                    const isSelected = currentTheme === th.id;
                    return (
                      <button
                        key={th.id}
                        type="button"
                        onClick={() => {
                          onSelectTheme(th.id);
                          onCloseMenu?.();
                        }}
                        onMouseEnter={() => document.documentElement.setAttribute('data-theme', th.id)}
                        onMouseLeave={restoreTheme}
                        className={`flex items-center justify-between p-2.5 rounded-xl text-xs transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-theme-card text-theme-text font-semibold border border-theme-accent/60 shadow-sm ring-1 ring-theme-accent/20'
                            : 'bg-theme-card/50 hover:bg-theme-card text-theme-muted hover:text-theme-text border border-white/[0.05] hover:border-theme-accent/30'
                        }`}
                      >
                        <span className="truncate font-medium">{th.name}</span>
                        <div className="flex items-center space-x-2 shrink-0">
                          <div className="flex items-center space-x-1 px-1.5 py-0.5 rounded-md bg-theme-base/60 border border-white/[0.04]">
                            {th.previewColors.map((color, idx) => (
                              <span
                                key={idx}
                                className="w-2.5 h-2.5 rounded-[3px] border border-black/30 shadow-xs"
                                style={{ backgroundColor: color }}
                              />
                            ))}
                          </div>
                          {isSelected && <Check size={14} className="text-theme-accent shrink-0 ml-1" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {customThemes.length > 0 && (
              <div className="pt-2 border-t border-theme-border/40 space-y-1.5">
                <div className="flex items-center space-x-2 px-1 text-[11px] font-bold text-theme-muted uppercase tracking-wider">
                  <div className="flex items-center space-x-1.5">
                    <Sparkles size={11} className="text-theme-muted" />
                    <span>{t('settings.importedThemes')}</span>
                  </div>
                  <div className="flex-1 h-px bg-white/[0.06]" />
                  <span className="text-[10px] font-mono opacity-60">{customThemes.length}</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {customThemes.map((ct) => {
                    const isSelected = currentTheme === ct.id;
                    return (
                      <div
                        key={ct.id}
                        onMouseEnter={() => document.documentElement.setAttribute('data-theme', ct.id)}
                        onMouseLeave={restoreTheme}
                        className={`flex items-center justify-between p-2.5 rounded-xl text-xs transition-all group ${
                          isSelected
                            ? 'bg-theme-card text-theme-text font-semibold border border-theme-accent/60 shadow-sm ring-1 ring-theme-accent/20'
                            : 'bg-theme-card/50 hover:bg-theme-card text-theme-muted hover:text-theme-text border border-white/[0.05] hover:border-theme-accent/30'
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => {
                            onSelectTheme(ct.id);
                            onCloseMenu?.();
                          }}
                          className="flex items-center space-x-2 flex-1 text-left truncate cursor-pointer"
                        >
                          <span className="truncate font-medium">{ct.name}</span>
                        </button>
                        <div className="flex items-center space-x-2 shrink-0">
                          <div className="flex items-center space-x-1 px-1.5 py-0.5 rounded-md bg-theme-base/60 border border-white/[0.04]">
                            <span
                              className="w-2.5 h-2.5 rounded-[3px] border border-black/30 shadow-xs"
                              style={{ backgroundColor: ct.colors.bgBase }}
                            />
                            <span
                              className="w-2.5 h-2.5 rounded-[3px] border border-black/30 shadow-xs"
                              style={{ backgroundColor: ct.colors.accent }}
                            />
                          </div>
                          {isSelected && <Check size={14} className="text-theme-accent shrink-0 ml-1" />}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onDeleteCustomTheme(ct.id);
                            }}
                            className="p-1 opacity-0 group-hover:opacity-100 text-theme-muted hover:text-red-400 cursor-pointer transition-opacity"
                            title={t('settings.deleteCustomTheme')}
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 2: Accent Palette */}
      {activeTab === 'accent' && (
        <div className="space-y-3">
          <div className="text-xs text-theme-muted">
            {t('settings.accentNotice')}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {ACCENTS.map((acc) => {
              const isSelected = currentAccent === acc.id;
              const label = acc.nameKey.startsWith('settings.') ? t(acc.nameKey) : acc.nameKey;
              return (
                <button
                  key={acc.id}
                  type="button"
                  onClick={() => onSelectAccent(acc.id)}
                  className={`flex items-center space-x-2 p-2 rounded-xl border text-xs font-medium transition-all cursor-pointer ${
                    isSelected
                      ? 'border-theme-accent bg-theme-card text-theme-text shadow-xs'
                      : 'border-white/[0.06] hover:bg-theme-hover text-theme-muted hover:text-theme-text'
                  }`}
                >
                  <span
                    className="w-3.5 h-3.5 rounded-[4px] shadow-xs border border-white/10 shrink-0"
                    style={{ backgroundColor: acc.color }}
                  />
                  <span className="truncate">{label}</span>
                  {isSelected && <Check size={12} className="ml-auto text-theme-accent shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab 3: VS Code Theme Importer */}
      {activeTab === 'import' && (
        <ThemeImporterTab
          importJsonText={importJsonText}
          importError={importError}
          onChangeImportText={setImportJsonText}
          onFileUpload={handleFileUpload}
          onImport={handleTextImport}
        />
      )}
    </div>
  );
};
