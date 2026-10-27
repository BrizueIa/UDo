import React, { useState, useRef, useEffect } from 'react';
import { ThemeId, AccentColor, CustomThemeDefinition } from '../types';
import { Palette, Check, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { parseVSCodeTheme } from '../utils/themeImporter';
import { PRESET_THEMES, ACCENTS } from '../data/themePresets';
import { ThemeImporterTab } from './ThemeImporterTab';

export { PRESET_THEMES, ACCENTS };

interface Props {
  currentTheme: ThemeId;
  currentAccent: AccentColor;
  customThemes: CustomThemeDefinition[];
  onSelectTheme: (theme: ThemeId) => void;
  onSelectAccent: (accent: AccentColor) => void;
  onImportCustomTheme: (theme: CustomThemeDefinition) => void;
  onDeleteCustomTheme: (id: string) => void;
}

export const ThemeSelectorMenu: React.FC<Props> = ({
  currentTheme,
  currentAccent,
  customThemes,
  onSelectTheme,
  onSelectAccent,
  onImportCustomTheme,
  onDeleteCustomTheme,
}) => {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'presets' | 'accent' | 'import'>('presets');
  const [themeCategoryFilter, setThemeCategoryFilter] = useState<'all' | 'dark' | 'light'>('all');
  const [importJsonText, setImportJsonText] = useState('');
  const [importError, setImportError] = useState<string | null>(null);

  const menuRef = useRef<HTMLDivElement>(null);

  // Restore theme on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        document.documentElement.setAttribute('data-theme', currentTheme);
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, currentTheme]);

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
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`p-1.5 rounded-md transition-colors ${
          isOpen ? 'text-theme-text bg-theme-hover' : 'hover:text-theme-text hover:bg-theme-hover'
        }`}
        title={t('settings.theme')}
      >
        <Palette size={15} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 5 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 5 }}
            transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
            onMouseLeave={() => document.documentElement.setAttribute('data-theme', currentTheme)}
            className="absolute right-0 top-full mt-2 w-80 bg-theme-card border border-theme-border rounded-xl shadow-2xl py-2 z-50 overflow-hidden"
          >
            {/* Tabs Header */}
            <div className="px-3 pb-2 border-b border-theme-border/40 flex items-center justify-between">
              <div className="flex items-center bg-theme-column/80 p-0.5 rounded-lg text-[10px] font-semibold">
                <button
                  onClick={() => setActiveTab('presets')}
                  className={`px-2 py-0.5 rounded-md transition-colors ${
                    activeTab === 'presets' ? 'bg-theme-accent text-white shadow-xs' : 'text-theme-muted hover:text-theme-text'
                  }`}
                >
                  {t('settings.themes')} ({PRESET_THEMES.length + customThemes.length})
                </button>
                <button
                  onClick={() => setActiveTab('accent')}
                  className={`px-2 py-0.5 rounded-md transition-colors ${
                    activeTab === 'accent' ? 'bg-theme-accent text-white shadow-xs' : 'text-theme-muted hover:text-theme-text'
                  }`}
                >
                  {t('settings.accent')}
                </button>
                <button
                  onClick={() => setActiveTab('import')}
                  className={`px-2 py-0.5 rounded-md transition-colors ${
                    activeTab === 'import' ? 'bg-theme-accent text-white shadow-xs' : 'text-theme-muted hover:text-theme-text'
                  }`}
                >
                  {t('settings.vscodeImporter')}
                </button>
              </div>
            </div>

            {/* Tab 1: Presets & Custom Themes */}
            {activeTab === 'presets' && (
              <div className="p-1.5 max-h-84 overflow-y-auto space-y-2">
                {/* Dark / Light Category Filter Pills */}
                <div className="flex items-center justify-between p-1 bg-theme-column/60 rounded-lg text-[10px] font-medium">
                  <button
                    onClick={() => setThemeCategoryFilter('all')}
                    className={`flex-1 py-1 rounded text-center transition-colors ${
                      themeCategoryFilter === 'all'
                        ? 'bg-theme-card text-theme-text font-semibold shadow-xs'
                        : 'text-theme-muted hover:text-theme-text'
                    }`}
                  >
                    {t('settings.allThemes')} ({PRESET_THEMES.length})
                  </button>
                  <button
                    onClick={() => setThemeCategoryFilter('dark')}
                    className={`flex-1 py-1 rounded text-center transition-colors ${
                      themeCategoryFilter === 'dark'
                        ? 'bg-theme-card text-theme-text font-semibold shadow-xs'
                        : 'text-theme-muted hover:text-theme-text'
                    }`}
                  >
                    🌙 {t('settings.darkThemes')} ({darkPresets.length})
                  </button>
                  <button
                    onClick={() => setThemeCategoryFilter('light')}
                    className={`flex-1 py-1 rounded text-center transition-colors ${
                      themeCategoryFilter === 'light'
                        ? 'bg-theme-card text-theme-text font-semibold shadow-xs'
                        : 'text-theme-muted hover:text-theme-text'
                    }`}
                  >
                    ☀️ {t('settings.lightThemes')} ({lightPresets.length})
                  </button>
                </div>

                {/* 🌙 Dark Themes Group */}
                {(themeCategoryFilter === 'all' || themeCategoryFilter === 'dark') && (
                  <div className="space-y-0.5">
                    <div className="px-2.5 py-1 text-[10px] font-bold text-theme-muted uppercase tracking-wider flex items-center justify-between">
                      <span>🌙 {t('settings.darkThemes')}</span>
                      <span className="text-[9px] opacity-70">{darkPresets.length}</span>
                    </div>
                    {darkPresets.map((th) => {
                      const isSelected = currentTheme === th.id;
                      return (
                        <button
                          key={th.id}
                          onClick={() => {
                            onSelectTheme(th.id);
                            setIsOpen(false);
                          }}
                          onMouseEnter={() => document.documentElement.setAttribute('data-theme', th.id)}
                          className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-colors ${
                            isSelected
                              ? 'bg-theme-column text-theme-text font-semibold border border-theme-accent/40 shadow-xs'
                              : 'text-theme-muted hover:text-theme-text hover:bg-theme-hover/60 border border-transparent'
                          }`}
                        >
                          <div className="flex items-center space-x-2">
                            <span>{th.icon}</span>
                            <span>{th.name}</span>
                          </div>

                          <div className="flex items-center space-x-2">
                            <div className="flex items-center space-x-1">
                              {th.previewColors.map((color, idx) => (
                                <span
                                  key={idx}
                                  className="w-2.5 h-2.5 rounded-full border border-black/20 shadow-xs"
                                  style={{ backgroundColor: color }}
                                />
                              ))}
                            </div>
                            {isSelected && <Check size={13} className="text-theme-accent" />}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* ☀️ Light Themes Group */}
                {(themeCategoryFilter === 'all' || themeCategoryFilter === 'light') && (
                  <div className="space-y-0.5 pt-1.5 border-t border-theme-border/30">
                    <div className="px-2.5 py-1 text-[10px] font-bold text-theme-muted uppercase tracking-wider flex items-center justify-between">
                      <span>☀️ {t('settings.lightThemes')}</span>
                      <span className="text-[9px] opacity-70">{lightPresets.length}</span>
                    </div>
                    {lightPresets.map((th) => {
                      const isSelected = currentTheme === th.id;
                      return (
                        <button
                          key={th.id}
                          onClick={() => {
                            onSelectTheme(th.id);
                            setIsOpen(false);
                          }}
                          onMouseEnter={() => document.documentElement.setAttribute('data-theme', th.id)}
                          className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-colors ${
                            isSelected
                              ? 'bg-theme-column text-theme-text font-semibold border border-theme-accent/40 shadow-xs'
                              : 'text-theme-muted hover:text-theme-text hover:bg-theme-hover/60 border border-transparent'
                          }`}
                        >
                          <div className="flex items-center space-x-2">
                            <span>{th.icon}</span>
                            <span>{th.name}</span>
                          </div>

                          <div className="flex items-center space-x-2">
                            <div className="flex items-center space-x-1">
                              {th.previewColors.map((color, idx) => (
                                <span
                                  key={idx}
                                  className="w-2.5 h-2.5 rounded-full border border-black/20 shadow-xs"
                                  style={{ backgroundColor: color }}
                                />
                              ))}
                            </div>
                            {isSelected && <Check size={13} className="text-theme-accent" />}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Custom Imported Themes */}
                {customThemes.length > 0 && (
                  <div className="pt-2 border-t border-theme-border/40 space-y-0.5">
                    <div className="px-2.5 py-1 text-[10px] font-bold text-theme-muted uppercase tracking-wider">
                      {t('settings.importedThemes')}
                    </div>
                    {customThemes.map((ct) => {
                      const isSelected = currentTheme === ct.id;
                      return (
                        <div
                          key={ct.id}
                          className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-colors group ${
                            isSelected
                              ? 'bg-theme-column text-theme-text font-semibold border border-theme-accent/40 shadow-xs'
                              : 'text-theme-muted hover:text-theme-text hover:bg-theme-hover/60 border border-transparent'
                          }`}
                        >
                          <button
                            onClick={() => {
                              onSelectTheme(ct.id);
                              setIsOpen(false);
                            }}
                            className="flex items-center space-x-2 flex-1 text-left"
                          >
                            <span>✨</span>
                            <span className="truncate">{ct.name}</span>
                          </button>
                          <div className="flex items-center space-x-1">
                            <span
                              className="w-2.5 h-2.5 rounded-full border border-black/20"
                              style={{ backgroundColor: ct.colors.bgBase }}
                            />
                            <span
                              className="w-2.5 h-2.5 rounded-full border border-black/20"
                              style={{ backgroundColor: ct.colors.accent }}
                            />
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onDeleteCustomTheme(ct.id);
                              }}
                              className="p-1 opacity-0 group-hover:opacity-100 text-theme-muted hover:text-red-400"
                              title={t('settings.deleteCustomTheme')}
                            >
                              <Trash2 size={11} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Tab 2: Accent Palette */}
            {activeTab === 'accent' && (
              <div className="p-3 space-y-3">
                <div className="text-[11px] text-theme-muted">
                  {t('settings.accentNotice')}
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {ACCENTS.map((acc) => {
                    const isSelected = currentAccent === acc.id;
                    const label = acc.nameKey.startsWith('settings.') ? t(acc.nameKey) : acc.nameKey;
                    return (
                      <button
                        key={acc.id}
                        onClick={() => onSelectAccent(acc.id)}
                        className={`flex items-center space-x-2 p-2 rounded-lg border text-xs font-medium transition-all ${
                          isSelected
                            ? 'border-theme-accent bg-theme-column text-theme-text shadow-xs'
                            : 'border-white/[0.06] hover:bg-theme-hover/50 text-theme-muted hover:text-theme-text'
                        }`}
                      >
                        <span
                          className="w-3.5 h-3.5 rounded-full shadow-xs border border-white/10"
                          style={{ backgroundColor: acc.color }}
                        />
                        <span className="truncate">{label}</span>
                        {isSelected && <Check size={12} className="ml-auto text-theme-accent" />}
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
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
