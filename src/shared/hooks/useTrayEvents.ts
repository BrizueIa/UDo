import { useEffect } from 'react';
import { api } from '../api/ipc';

interface TrayEventHandlers {
  onToggleWidget: () => void;
  onQuickAdd: () => void;
}

export function useTrayEvents({ onToggleWidget, onQuickAdd }: TrayEventHandlers) {
  useEffect(() => {
    if (!api.isTauri) return;
    let unlistenWidget: (() => void) | undefined;
    let unlistenQuickAdd: (() => void) | undefined;

    import('@tauri-apps/api/event').then(({ listen }) => {
      listen('tray:toggle-widget', () => onToggleWidget()).then((un) => {
        unlistenWidget = un;
      });
      listen('tray:quick-add', () => onQuickAdd()).then((un) => {
        unlistenQuickAdd = un;
      });
    });

    return () => {
      unlistenWidget?.();
      unlistenQuickAdd?.();
    };
  }, [onToggleWidget, onQuickAdd]);
}
