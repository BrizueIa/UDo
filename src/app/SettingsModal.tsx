import React, { useState, useEffect } from 'react';
import {
  Settings,
  X,
  Palette,
  Volume2,
  Globe,
  CheckCircle2,
  Keyboard,
  Check,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { ThemeId, AccentColor, CustomThemeDefinition } from '../shared/types';
import { ThemeSettingsPanel } from '../shared/ui/ThemeSettingsPanel';
import { AudioSettingsTab } from './AudioSettingsTab';
import { ShortcutsSettingsTab } from './ShortcutsSettingsTab';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  currentTheme: ThemeId;
  currentAccent: AccentColor;
  customThemes: CustomThemeDefinition[];
  onSelectTheme: (theme: ThemeId) => void;
  onSelectAccent: (accent: AccentColor) => void;
  onImportCustomTheme: (theme: CustomThemeDefinition) => void;
  onDeleteCustomTheme: (id: string) => void;
  isAudioMuted: boolean;
  audioVolume: number;
  onVolumeChange: (vol: number) => void;
  onToggleAudioMute: () => void;
  onOpenShortcuts?: () => void;
  initialTab?: 'appearance' | 'audio' | 'shortcuts' | 'general';
}

export const SettingsModal: React.FC<Props> = ({
  isOpen,
  onClose,
  currentTheme,
  currentAccent,
  customThemes,
  onSelectTheme,
  onSelectAccent,
  onImportCustomTheme,
  onDeleteCustomTheme,
  isAudioMuted,
  audioVolume,
  onVolumeChange,
  onToggleAudioMute,
  initialTab = 'appearance',
}) => {
  const { t, i18n } = useTranslation();
  const [activeTab, setActiveTab] = useState<'appearance' | 'audio' | 'shortcuts' | 'general'>(initialTab);

  useEffect(() => {
    if (isOpen) setActiveTab(initialTab);
  }, [isOpen, initialTab]);

  // Ensure current theme is preserved when modal closes or unmounts
  useEffect(() => {
    if (!isOpen) {
      document.documentElement.setAttribute('data-theme', currentTheme);
    }
    return () => {
      document.documentElement.setAttribute('data-theme', currentTheme);
    };
  }, [isOpen, currentTheme]);

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const navItems = [
    { id: 'appearance', label: t('settings.appearanceTab'), icon: <Palette size={15} /> },
    { id: 'audio', label: t('settings.audioTab'), icon: <Volume2 size={15} /> },
    { id: 'shortcuts', label: t('settings.shortcutsTab'), icon: <Keyboard size={15} /> },
    { id: 'general', label: t('settings.generalTab'), icon: <Globe size={15} /> },
  ] as const;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 select-none animate-in fade-in duration-100"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl bg-theme-sidebar border border-theme-border rounded-2xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-theme-border">
          <div className="flex items-center space-x-2.5">
            <Settings size={18} className="text-theme-accent" />
            <span className="font-semibold text-sm text-theme-text">{t('settings.title')}</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-md text-theme-muted hover:text-theme-text hover:bg-theme-hover transition-colors cursor-pointer"
            title={t('settings.close')}
          >
            <X size={16} />
          </button>
        </div>

        {/* Body with Sidebar Tabs */}
        <div className="flex flex-1 min-h-0 overflow-hidden">
          {/* Left Navigation */}
          <div className="w-44 border-r border-theme-border/60 p-3 space-y-1 bg-theme-column/30 shrink-0">
            {navItems.map((item) => {
              const isSelected = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center space-x-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-colors cursor-pointer text-left ${
                    isSelected
                      ? 'bg-theme-accent text-white shadow-xs font-semibold'
                      : 'text-theme-muted hover:text-theme-text hover:bg-theme-hover'
                  }`}
                >
                  <span className="shrink-0">{item.icon}</span>
                  <span className="truncate">{item.label}</span>
                </button>
              );
            })}
          </div>

          {/* Right Content Area */}
          <div className="flex-1 p-5 overflow-y-auto min-h-0">
            {/* 🎨 Appearance Tab */}
            {activeTab === 'appearance' && (
              <ThemeSettingsPanel
                currentTheme={currentTheme}
                currentAccent={currentAccent}
                customThemes={customThemes}
                onSelectTheme={onSelectTheme}
                onSelectAccent={onSelectAccent}
                onImportCustomTheme={onImportCustomTheme}
                onDeleteCustomTheme={onDeleteCustomTheme}
              />
            )}

            {/* 🔊 Audio & Sound Tab */}
            {activeTab === 'audio' && (
              <AudioSettingsTab
                isAudioMuted={isAudioMuted}
                audioVolume={audioVolume}
                onVolumeChange={onVolumeChange}
                onToggleAudioMute={onToggleAudioMute}
              />
            )}

            {/* ⌨️ Keyboard Shortcuts Tab */}
            {activeTab === 'shortcuts' && (
              <ShortcutsSettingsTab />
            )}

            {/* 🌐 General / Language Tab */}
            {activeTab === 'general' && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <span className="text-xs font-medium text-theme-text">
                    {t('settings.selectLanguage')}
                  </span>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {/* Spanish Option */}
                    <button
                      type="button"
                      onClick={() => i18n.changeLanguage('es')}
                      className={`flex items-center justify-between p-3 rounded-xl border text-left transition-all cursor-pointer ${
                        i18n.language.startsWith('es')
                          ? 'border-theme-accent bg-theme-card text-theme-text shadow-xs'
                          : 'border-white/[0.06] hover:bg-theme-hover text-theme-muted hover:text-theme-text'
                      }`}
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center space-x-2 text-xs font-semibold text-theme-text">
                          <span className="text-base">🇪🇸</span>
                          <span>{t('settings.spanish')}</span>
                        </div>
                        <p className="text-[11px] text-theme-muted">
                          {t('settings.spanishDesc')}
                        </p>
                      </div>
                      {i18n.language.startsWith('es') && (
                        <Check size={14} className="text-theme-accent shrink-0" />
                      )}
                    </button>

                    {/* English Option */}
                    <button
                      type="button"
                      onClick={() => i18n.changeLanguage('en')}
                      className={`flex items-center justify-between p-3 rounded-xl border text-left transition-all cursor-pointer ${
                        i18n.language.startsWith('en')
                          ? 'border-theme-accent bg-theme-card text-theme-text shadow-xs'
                          : 'border-white/[0.06] hover:bg-theme-hover text-theme-muted hover:text-theme-text'
                      }`}
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center space-x-2 text-xs font-semibold text-theme-text">
                          <span className="text-base">🇺🇸</span>
                          <span>{t('settings.english')}</span>
                        </div>
                        <p className="text-[11px] text-theme-muted">
                          {t('settings.englishDesc')}
                        </p>
                      </div>
                      {i18n.language.startsWith('en') && (
                        <Check size={14} className="text-theme-accent shrink-0" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end px-5 py-3 border-t border-theme-border bg-theme-column/30">
          <button
            type="button"
            onClick={onClose}
            className="flex items-center space-x-1.5 px-4 py-1.5 rounded-lg bg-theme-accent text-white font-medium hover:bg-theme-accent-hover text-xs transition-colors cursor-pointer shadow-sm"
          >
            <CheckCircle2 size={13} />
            <span>{t('audioSettings.done')}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
