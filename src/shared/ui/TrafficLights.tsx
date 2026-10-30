import React from 'react';
import { Minus, Square, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { api } from '../api/ipc';

interface Props {
  showMinMax?: boolean;
  styleMode?: 'native' | 'mac';
}

export const TrafficLights: React.FC<Props> = ({
  showMinMax = true,
  styleMode = 'native',
}) => {
  const { t } = useTranslation();

  if (styleMode === 'mac') {
    return (
      <div className="flex items-center space-x-2 select-none pr-1" data-tauri-drag-region="false">
        <button
          onClick={() => api.closeWindowToTray()}
          aria-label={t('window.closeToTray')}
          title={t('window.closeToTray')}
          className="w-3 h-3 rounded-full bg-red-500/80 hover:bg-red-500 transition-colors cursor-pointer border border-red-600/40"
        />
        <button
          onClick={() => api.minimizeWindow()}
          aria-label={t('window.minimize')}
          title={t('window.minimize')}
          className="w-3 h-3 rounded-full bg-amber-500/80 hover:bg-amber-500 transition-colors cursor-pointer border border-amber-600/40"
        />
        <button
          onClick={() => api.toggleMaximizeWindow()}
          aria-label={t('window.maximize')}
          title={t('window.maximize')}
          className="w-3 h-3 rounded-full bg-emerald-500/80 hover:bg-emerald-500 transition-colors cursor-pointer border border-emerald-600/40"
        />
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-1 select-none pointer-events-auto" data-tauri-drag-region="false">
      {/* Minimize */}
      {showMinMax && (
        <button
          onClick={() => api.minimizeWindow()}
          aria-label={t('window.minimize')}
          title={t('window.minimize')}
          className="w-6 h-6 rounded-md flex items-center justify-center text-theme-muted hover:text-theme-text hover:bg-theme-card transition-colors cursor-pointer"
        >
          <Minus size={12} />
        </button>
      )}

      {/* Maximize / Restore */}
      {showMinMax && (
        <button
          onClick={() => api.toggleMaximizeWindow()}
          aria-label={t('window.maximize')}
          title={t('window.maximize')}
          className="w-6 h-6 rounded-md flex items-center justify-center text-theme-muted hover:text-theme-text hover:bg-theme-card transition-colors cursor-pointer"
        >
          <Square size={10} />
        </button>
      )}

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
