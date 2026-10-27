import React from 'react';
import { X, Keyboard } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const ShortcutsModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const { t } = useTranslation();
  if (!isOpen) return null;

  const shortcuts = [
    { key: 'Ctrl + K  /  /', desc: 'Open Global Search & Command Palette' },
    { key: 'Alt + Shift + Space', desc: 'Summon / Hide App (Global OS Hotkey)' },
    { key: 'Ctrl + Alt + Space', desc: 'Quick Add / Scratchpad Bar' },
    { key: 'Alt + W', desc: 'Toggle Full Window ↔ Floating Always-on-Top Widget' },
    { key: 'Ctrl + N', desc: 'Create New Note in Current Folder' },
    { key: 'Ctrl + Shift + N', desc: 'Create New Folder / Subject' },
    { key: 'Ctrl + D  /  Ctrl + Enter', desc: 'Toggle Strikethrough / Complete Note' },
    { key: 'Tab  /  Shift + Tab', desc: 'Cycle Columns (Subjects ↔ Folders ↔ Note)' },
    { key: 'j  /  k  (or  ↓ / ↑)', desc: 'Navigate Notes in List' },
    { key: 'F11', desc: 'Zen Mode (Distraction-free Writing)' },
    { key: '?', desc: 'Show this Shortcuts Cheat Sheet' },
    { key: 'Esc', desc: 'Close Modals / Clear Search / Unfocus' },
  ];

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 select-none animate-in fade-in duration-100"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg bg-theme-sidebar border border-theme-border rounded-2xl shadow-2xl p-6 space-y-4"
      >
        <div className="flex items-center justify-between pb-2 border-b border-theme-border">
          <div className="flex items-center space-x-2 text-theme-text font-semibold text-sm">
            <Keyboard size={18} className="text-theme-accent" />
            <span>{t('shortcuts.title')}</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-theme-muted hover:text-theme-text hover:bg-theme-hover transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
          {shortcuts.map((s, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between py-1.5 px-2 rounded-lg hover:bg-theme-card/50 text-xs transition-colors"
            >
              <span className="text-theme-muted font-medium">{s.desc}</span>
              <kbd className="font-mono text-[11px] px-2 py-0.5 rounded bg-theme-card border border-theme-border/80 text-theme-accent font-semibold shadow-sm">
                {s.key}
              </kbd>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
