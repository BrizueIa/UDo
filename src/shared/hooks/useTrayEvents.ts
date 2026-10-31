import { useEffect } from 'react';
import { api } from '../api/ipc';

interface TrayEventHandlers {
  onToggleWidget: () => void;
  onQuickAdd: () => void;
  onRestoreFull?: () => void;
}

export function useTrayEvents({ onToggleWidget, onQuickAdd, onRestoreFull }: TrayEventHandlers) {
  useEffect(() => {
    if (!api.isTauri) return;
    let unlistenWidget: (() => void) | undefined;
    let unlistenQuickAdd: (() => void) | undefined;
    let unlistenRestoreFull: (() => void) | undefined;

    import('@tauri-apps/api/event').then(({ listen }) => {
      listen('tray:toggle-widget', () => onToggleWidget()).then((un) => {
        unlistenWidget = un;
      });
      listen('tray:quick-add', () => onQuickAdd()).then((un) => {
        unlistenQuickAdd = un;
      });
      if (onRestoreFull) {
        listen('tray:restore-full', () => onRestoreFull()).then((un) => {
          unlistenRestoreFull = un;
        });
      }
    });

    return () => {
      unlistenWidget?.();
      unlistenQuickAdd?.();
      unlistenRestoreFull?.();
    };
  }, [onToggleWidget, onQuickAdd, onRestoreFull]);
}
