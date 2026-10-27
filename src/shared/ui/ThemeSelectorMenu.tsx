import React, { useState, useRef, useEffect } from 'react';
import { ThemeId, AccentColor, CustomThemeDefinition } from '../types';
import { Palette, Check, Upload, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { parseVSCodeTheme } from '../utils/themeImporter';

export const PRESET_THEMES: {
  id: ThemeId;
  name: string;
  category: 'dark' | 'light';
  icon: string;
  previewColors: [string, string, string];
}[] = [
  // 🌙 Temas Oscuros (Antigravity)
  { id: 'tokyo-night', name: 'Tokyo Night', category: 'dark', icon: '🌙', previewColors: ['#1a1b26', '#7aa2f7', '#bb9af7'] },
  { id: 'default-dark', name: 'Default Dark', category: 'dark', icon: '🌑', previewColors: ['#1e1e1e', '#007acc', '#cccccc'] },
  { id: 'catppuccin-mocha', name: 'Catppuccin Mocha', category: 'dark', icon: '☕', previewColors: ['#1e1e2e', '#cba6f7', '#89b4fa'] },
  { id: 'dracula', name: 'Dracula', category: 'dark', icon: '🧛', previewColors: ['#282a36', '#bd93f9', '#ff79c6'] },
  { id: 'gruvbox', name: 'Gruvbox Material', category: 'dark', icon: '🌲', previewColors: ['#282828', '#fe8019', '#fabd2f'] },
  { id: 'monokai', name: 'Monokai', category: 'dark', icon: '🎨', previewColors: ['#272822', '#a6e22e', '#fd971f'] },
  { id: 'one-dark', name: 'One Dark Pro', category: 'dark', icon: '🌌', previewColors: ['#21252b', '#61afef', '#98c379'] },
  { id: 'solarized-dark', name: 'Solarized Dark', category: 'dark', icon: '🌊', previewColors: ['#002b36', '#268bd2', '#2aa198'] },
  { id: 'vesper', name: 'Vesper', category: 'dark', icon: '⚡', previewColors: ['#101010', '#ffc799', '#ffffff'] },
  { id: 'oled', name: 'OLED Pure Black', category: 'dark', icon: '🖤', previewColors: ['#000000', '#6366f1', '#fafafa'] },
  { id: 'nord', name: 'Nord', category: 'dark', icon: '❄️', previewColors: ['#2e3440', '#88c0d0', '#81a1c1'] },
  { id: 'rose-pine', name: 'Rosé Pine', category: 'dark', icon: '🌸', previewColors: ['#191724', '#ebbcba', '#c4a7e7'] },
  { id: 'synthwave', name: "Synthwave '84", category: 'dark', icon: '🌆', previewColors: ['#1f1635', '#fe4450', '#ff7edb'] },

  // ☀️ Temas Claros (Antigravity)
  { id: 'default-light', name: 'Default Light', category: 'light', icon: '☀️', previewColors: ['#ffffff', '#0969da', '#1f2328'] },
  { id: 'catppuccin-latte', name: 'Catppuccin Latte', category: 'light', icon: '🥛', previewColors: ['#eff1f5', '#8839ef', '#4c4f69'] },
  { id: 'gruvbox-light', name: 'Gruvbox Material', category: 'light', icon: '🌻', previewColors: ['#fbf1c7', '#af3a03', '#3c3836'] },
  { id: 'one-light', name: 'One Light', category: 'light', icon: '💡', previewColors: ['#fafafa', '#4078f2', '#383a42'] },
  { id: 'solarized-light', name: 'Solarized Light', category: 'light', icon: '🏖️', previewColors: ['#fdf6e3', '#268bd2', '#657b83'] },
];

export const ACCENTS: { id: AccentColor; nameKey: string; color: string }[] = [
  { id: 'default', nameKey: 'settings.originalTheme', color: 'var(--color-accent)' },
  { id: 'blue', nameKey: 'Blue', color: '#3b82f6' },
  { id: 'purple', nameKey: 'Purple', color: '#8b5cf6' },
  { id: 'emerald', nameKey: 'Emerald', color: '#10b981' },
  { id: 'amber', nameKey: 'Amber', color: '#f59e0b' },
  { id: 'rose', nameKey: 'Rose', color: '#f43f5e' },
  { id: 'cyan', nameKey: 'Cyan', color: '#06b6d4' },
];

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
  const fileInputRef = useRef<HTMLInputElement>(null);

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
              <div className="p-3 space-y-2.5">
                <div className="text-[11px] text-theme-muted leading-tight">
                  {t('settings.vscodeNotice')}
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json"
                  onChange={handleFileUpload}
                  className="hidden"
                />

                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border border-dashed border-white/[0.12] hover:border-theme-accent/60 rounded-xl p-3 text-center cursor-pointer transition-colors bg-theme-column/40 hover:bg-theme-column"
                >
                  <Upload size={18} className="mx-auto text-theme-accent mb-1" />
                  <p className="text-[11px] font-medium text-theme-text">
                    {t('settings.dragVscodeFile')}
                  </p>
                </div>

                <div className="space-y-1.5 pt-1">
                  <div className="text-[10px] font-semibold text-theme-muted uppercase tracking-wider">
                    {t('settings.orPasteJson')}
                  </div>
                  <textarea
                    value={importJsonText}
                    onChange={(e) => setImportJsonText(e.target.value)}
                    placeholder='{"name": "My Theme", "colors": { ... }}'
                    rows={3}
                    className="w-full bg-theme-column px-2.5 py-1.5 rounded-lg border border-white/[0.06] text-theme-text font-mono text-[10px] outline-none focus:border-theme-accent"
                  />
                  <button
                    onClick={handleTextImport}
                    disabled={!importJsonText.trim()}
                    className="w-full py-1.5 rounded-lg bg-theme-accent text-white text-xs font-semibold hover:bg-theme-accent-hover transition-colors disabled:opacity-50 shadow-xs"
                  >
                    {t('settings.importButton')}
                  </button>
                </div>

                {importError && (
                  <div className="p-2 rounded bg-red-500/10 border border-red-500/30 text-red-400 text-[11px]">
                    {importError}
                  </div>
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
