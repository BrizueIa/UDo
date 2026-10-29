import React from 'react';
import { useTranslation } from 'react-i18next';

export const ShortcutsSettingsTab: React.FC = () => {
  const { t } = useTranslation();

  const shortcutGroups = [
    {
      titleKey: 'shortcuts.groupGeneral',
      items: [
        { key: 'Ctrl + K  /  /', descKey: 'shortcuts.globalSearch' },
        { key: 'Ctrl + ,', descKey: 'settings.title' },
        { key: 'Alt + W', descKey: 'shortcuts.toggleWidget' },
        { key: 'F11', descKey: 'shortcuts.zenMode' },
        { key: 'Alt + Shift + Space', descKey: 'shortcuts.summonApp' },
        { key: 'Esc', descKey: 'shortcuts.escapeAction' },
      ],
    },
    {
      titleKey: 'shortcuts.groupNotes',
      items: [
        { key: 'Ctrl + N', descKey: 'shortcuts.newNote' },
        { key: 'Ctrl + Shift + N', descKey: 'shortcuts.newFolder' },
        { key: 'Ctrl + Space', descKey: 'shortcuts.quickAdd' },
        { key: 'Ctrl + D  /  Ctrl + Enter', descKey: 'shortcuts.toggleDone' },
        { key: 'Ctrl + F', descKey: 'shortcuts.findInNote' },
        { key: 'Ctrl + Shift + F', descKey: 'shortcuts.searchCategory' },
        { key: 'Ctrl + E', descKey: 'shortcuts.focusEditor' },
      ],
    },
    {
      titleKey: 'shortcuts.groupNavigation',
      items: [
        { key: 'Ctrl + B', descKey: 'shortcuts.toggleSidebar' },
        { key: 'Ctrl + \\', descKey: 'shortcuts.toggleFolders' },
        { key: 'Tab  /  Shift + Tab', descKey: 'shortcuts.cycleColumns' },
        { key: '1  /  2  /  3', descKey: 'shortcuts.jumpColumn' },
        { key: 'j  /  k  (↓  /  ↑)', descKey: 'shortcuts.navigateList' },
      ],
    },
  ];

  return (
    <div className="space-y-4">
      {shortcutGroups.map((group, gIdx) => (
        <div key={gIdx} className="space-y-2">
          <div className="text-[11px] font-bold text-theme-muted uppercase tracking-wider px-1">
            {t(group.titleKey, group.titleKey)}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
            {group.items.map((item, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-2 rounded-xl bg-theme-card/60 hover:bg-theme-card border border-white/[0.04] text-xs transition-colors"
              >
                <span className="text-theme-muted font-medium truncate mr-2">
                  {t(item.descKey)}
                </span>
                <kbd className="font-mono text-[10px] px-2 py-0.5 rounded bg-theme-base border border-theme-border/80 text-theme-accent font-semibold shadow-xs shrink-0">
                  {item.key}
                </kbd>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};
