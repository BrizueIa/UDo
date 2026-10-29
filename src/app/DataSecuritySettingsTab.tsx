import React, { useState, useEffect, useCallback } from 'react';
import { Lock, KeyRound, Download, Upload, History, Power, Check, AlertCircle, FileText } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { backupIpc } from '../features/backup/api/backupIpc';
import { BackupInfo } from '../shared/types';

interface Props {
  hasVaultPin: boolean;
  isVaultUnlocked: boolean;
  onOpenPinSetup: () => void;
  onOpenPinChange: () => void;
  onLockVault: () => void;
  onWorkspaceReloaded?: () => void;
}

export const DataSecuritySettingsTab: React.FC<Props> = ({
  hasVaultPin,
  isVaultUnlocked,
  onOpenPinSetup,
  onOpenPinChange,
  onLockVault,
  onWorkspaceReloaded,
}) => {
  const { t } = useTranslation();
  const [backups, setBackups] = useState<BackupInfo[]>([]);
  const [autostart, setAutostart] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const loadData = useCallback(async () => {
    const list = await backupIpc.listAutoBackups();
    setBackups(list);
    const auto = await backupIpc.isAutostartEnabled();
    setAutostart(auto);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleToggleAutostart = async () => {
    const next = !autostart;
    await backupIpc.setAutostartEnabled(next);
    setAutostart(next);
  };

  const handleExport = async () => {
    try {
      if (typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window) {
        const { save } = await import('@tauri-apps/plugin-dialog');
        const defaultName = `udo-backup-${new Date().toISOString().slice(0, 10)}.json`;
        const path = await save({
          defaultPath: defaultName,
          filters: [{ name: 'JSON Backup', extensions: ['json'] }],
        });
        if (path) {
          await backupIpc.exportWorkspaceJson(path);
          setStatusMsg({ type: 'success', text: t('backup.exportSuccess') || 'Copia exportada con éxito' });
        }
      } else {
        await backupIpc.exportWorkspaceJson('udo-backup.json');
        setStatusMsg({ type: 'success', text: t('backup.exportSuccess') || 'Copia exportada con éxito' });
      }
    } catch {
      setStatusMsg({ type: 'error', text: t('backup.exportError') || 'Error al exportar la copia' });
    }
  };

  const handleImport = async () => {
    try {
      if (typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window) {
        const { open } = await import('@tauri-apps/plugin-dialog');
        const path = await open({
          multiple: false,
          filters: [{ name: 'JSON Backup', extensions: ['json'] }],
        });
        if (path && typeof path === 'string') {
          await backupIpc.importWorkspaceJson(path);
          setStatusMsg({ type: 'success', text: t('backup.importSuccess') || 'Copia importada con éxito' });
          if (onWorkspaceReloaded) onWorkspaceReloaded();
        }
      } else {
        setStatusMsg({ type: 'error', text: t('backup.importWebUnavailable') || 'Solo disponible en la app de escritorio' });
      }
    } catch {
      setStatusMsg({ type: 'error', text: t('backup.importError') || 'Error al restaurar la copia' });
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    return `${(bytes / 1024).toFixed(1)} KB`;
  };

  return (
    <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6 select-none">
      {statusMsg && (
        <div
          className={`flex items-center space-x-2 p-3 rounded-xl text-xs font-medium ${
            statusMsg.type === 'success'
              ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-400'
              : 'bg-rose-500/15 border border-rose-500/30 text-rose-400'
          }`}
        >
          {statusMsg.type === 'success' ? <Check size={14} /> : <AlertCircle size={14} />}
          <span>{statusMsg.text}</span>
        </div>
      )}

      {/* Private Vault Section */}
      <section className="space-y-3">
        <div className="flex items-center space-x-2 text-theme-text font-bold text-xs uppercase tracking-wider">
          <Lock size={14} className="text-theme-accent" />
          <span>{t('vault.title') || 'Bóveda Privada'}</span>
        </div>
        <div className="p-4 rounded-xl bg-theme-column/50 border border-theme-border flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-theme-text">
              {hasVaultPin
                ? isVaultUnlocked
                  ? t('vault.statusUnlocked') || 'Desbloqueada'
                  : t('vault.statusLocked') || 'Protegida con PIN'
                : t('vault.noPinConfigured') || 'Sin PIN configurado'}
            </div>
            <div className="text-[11px] text-theme-muted mt-0.5">
              {t('vault.description') || 'Oculta proyectos y notas privadas con un PIN de 6 dígitos'}
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {!hasVaultPin ? (
              <button
                type="button"
                onClick={onOpenPinSetup}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-theme-accent text-white text-xs font-semibold hover:bg-theme-accent-hover transition-colors shadow-xs"
              >
                <KeyRound size={13} />
                <span>{t('vault.setPin') || 'Configurar PIN'}</span>
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={onOpenPinChange}
                  className="px-2.5 py-1.5 rounded-lg bg-theme-card border border-theme-border text-theme-text text-xs hover:bg-theme-hover transition-colors"
                >
                  {t('vault.changePin') || 'Cambiar PIN'}
                </button>
                {isVaultUnlocked && (
                  <button
                    type="button"
                    onClick={onLockVault}
                    className="px-2.5 py-1.5 rounded-lg bg-rose-500/15 text-rose-400 hover:bg-rose-500/25 text-xs font-medium transition-colors"
                  >
                    {t('vault.lockNow') || 'Bloquear ahora'}
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </section>

      {/* Backups & Restore Section */}
      <section className="space-y-3">
        <div className="flex items-center space-x-2 text-theme-text font-bold text-xs uppercase tracking-wider">
          <History size={14} className="text-theme-accent" />
          <span>{t('backup.title') || 'Copias de Seguridad (JSON)'}</span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={handleExport}
            className="p-3.5 rounded-xl bg-theme-column/50 border border-theme-border hover:border-theme-accent/50 text-left transition-all group"
          >
            <div className="flex items-center space-x-2 text-theme-accent mb-1">
              <Download size={15} />
              <span className="text-xs font-semibold">{t('backup.exportTitle') || 'Exportar Base de Datos'}</span>
            </div>
            <p className="text-[11px] text-theme-muted">{t('backup.exportDesc') || 'Guarda un archivo .json con tus notas'}</p>
          </button>

          <button
            type="button"
            onClick={handleImport}
            className="p-3.5 rounded-xl bg-theme-column/50 border border-theme-border hover:border-theme-accent/50 text-left transition-all group"
          >
            <div className="flex items-center space-x-2 text-theme-accent mb-1">
              <Upload size={15} />
              <span className="text-xs font-semibold">{t('backup.importTitle') || 'Restaurar Respaldo'}</span>
            </div>
            <p className="text-[11px] text-theme-muted">{t('backup.importDesc') || 'Restaura tus datos desde un archivo .json'}</p>
          </button>
        </div>

        {/* Auto backups list */}
        {backups.length > 0 && (
          <div className="space-y-1.5 pt-1">
            <span className="text-[11px] font-semibold text-theme-muted uppercase tracking-wider">
              {t('backup.recentAutoBackups') || 'Respaldos automáticos diarios (últimos 14)'}
            </span>
            <div className="max-h-36 overflow-y-auto space-y-1 pr-1">
              {backups.map((b) => (
                <div
                  key={b.filename}
                  className="flex items-center justify-between p-2 rounded-lg bg-theme-card/60 border border-theme-border/50 text-xs text-theme-text"
                >
                  <div className="flex items-center space-x-2 truncate">
                    <FileText size={13} className="text-theme-muted flex-shrink-0" />
                    <span className="font-mono text-[11px] truncate">{b.filename}</span>
                  </div>
                  <div className="flex items-center space-x-3 text-theme-muted text-[11px] flex-shrink-0">
                    <span>{formatBytes(b.sizeBytes)}</span>
                    <span>{b.createdAt}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Autostart Section */}
      <section className="space-y-3">
        <div className="flex items-center space-x-2 text-theme-text font-bold text-xs uppercase tracking-wider">
          <Power size={14} className="text-theme-accent" />
          <span>{t('settings.systemTab') || 'Inicio con el Sistema'}</span>
        </div>
        <div className="p-4 rounded-xl bg-theme-column/50 border border-theme-border flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-theme-text">{t('settings.autostartTitle') || 'Iniciar UDo al encender el equipo'}</div>
            <div className="text-[11px] text-theme-muted mt-0.5">
              {t('settings.autostartDesc') || 'Abre UDo automáticamente en segundo plano al iniciar sesión'}
            </div>
          </div>
          <button
            type="button"
            onClick={handleToggleAutostart}
            className={`w-11 h-6 rounded-full transition-colors relative p-0.5 ${
              autostart ? 'bg-theme-accent' : 'bg-theme-card border border-theme-border'
            }`}
          >
            <div
              className={`w-5 h-5 rounded-full bg-white transition-transform shadow-xs ${
                autostart ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      </section>
    </div>
  );
};
