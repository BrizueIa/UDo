import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, ExternalLink, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { UpdateInfo } from '../hooks/useUpdateChecker';

interface UpdateNotificationBannerProps {
  updateInfo: UpdateInfo | null;
  onDismiss: () => void;
  onOpenRelease: () => void;
}

export const UpdateNotificationBanner: React.FC<UpdateNotificationBannerProps> = ({
  updateInfo,
  onDismiss,
  onOpenRelease,
}) => {
  const { t } = useTranslation();

  if (!updateInfo || !updateInfo.available) return null;

  return (
    <AnimatePresence>
      <motion.aside
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.95 }}
        transition={{ type: 'spring', damping: 20, stiffness: 300 }}
        className="fixed bottom-6 right-6 z-50 max-w-sm w-full bg-theme-panel/95 backdrop-blur-md border border-theme-accent/30 rounded-xl shadow-2xl p-4 text-theme-text overflow-hidden"
        role="alert"
        aria-live="polite"
      >
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-theme-accent via-theme-accent/70 to-theme-accent/30" />
        
        <div className="flex items-start justify-between gap-3">
          <div className="p-2 bg-theme-accent/15 rounded-lg text-theme-accent shrink-0 mt-0.5">
            <Sparkles className="w-5 h-5" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-theme-accent tracking-wide uppercase">
                {t('updates.badge', 'Actualización')}
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full font-mono bg-theme-accent/20 text-theme-accent font-semibold">
                {updateInfo.latestVersion}
              </span>
            </div>

            <h4 className="text-sm font-medium text-theme-text mt-1 leading-snug">
              {updateInfo.releaseName || t('updates.availableTitle', 'Nueva versión disponible')}
            </h4>

            <p className="text-xs text-theme-muted mt-1 leading-relaxed">
              {t('updates.availableDesc', 'Hay mejoras y correcciones listas para UDo.')}
            </p>

            <div className="mt-3 flex items-center gap-2">
              <button
                type="button"
                onClick={onOpenRelease}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-theme-accent text-white rounded-lg shadow-sm hover:opacity-90 active:scale-95 transition-all"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                {t('updates.viewAndDownload', 'Ver y Actualizar')}
              </button>

              <button
                type="button"
                onClick={onDismiss}
                className="px-2.5 py-1.5 text-xs font-medium text-theme-muted hover:text-theme-text hover:bg-theme-hover rounded-lg transition-colors"
              >
                {t('updates.dismiss', 'Más tarde')}
              </button>
            </div>
          </div>

          <button
            type="button"
            onClick={onDismiss}
            className="text-theme-muted hover:text-theme-text p-1 rounded-md hover:bg-theme-hover transition-colors shrink-0"
            aria-label={t('common.close', 'Cerrar')}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </motion.aside>
    </AnimatePresence>
  );
};
