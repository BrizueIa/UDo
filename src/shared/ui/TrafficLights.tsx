import React from 'react';
import { Minus, Square, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { api } from '../api/ipc';

export const TrafficLights: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div className="flex items-center space-x-1 select-none" data-tauri-drag-region="false">
      {/* Minimize */}
      <button
        onClick={() => api.minimizeWindow()}
        aria-label={t('window.minimize')}
        title={t('window.minimize')}
        className="w-6 h-6 rounded-md flex items-center justify-center text-theme-muted hover:text-theme-text hover:bg-theme-card transition-colors cursor-pointer"
      >
        <Minus size={12} />
      </button>

      {/* Maximize / Restore */}
      <button
        onClick={() => api.toggleMaximizeWindow()}
        aria-label={t('window.maximize')}
        title={t('window.maximize')}
        className="w-6 h-6 rounded-md flex items-center justify-center text-theme-muted hover:text-theme-text hover:bg-theme-card transition-colors cursor-pointer"
      >
        <Square size={10} />
      </button>

      {/* Close to Tray */}
      <button
        onClick={() => api.closeWindowToTray()}
        aria-label={t('window.closeToTray')}
        title={t('window.closeToTray')}
        className="w-6 h-6 rounded-md flex items-center justify-center text-theme-muted hover:text-white hover:bg-red-500/90 transition-colors cursor-pointer"
      >
        <X size={12} />
      </button>
    </div>
  );
};
