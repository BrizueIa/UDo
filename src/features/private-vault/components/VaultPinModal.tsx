import React, { useState, useEffect, useCallback } from 'react';
import { Lock, KeyRound, Delete, X, AlertCircle, CornerDownLeft } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { vaultIpc } from '../api/vaultIpc';

export type VaultModalMode = 'unlock' | 'setup' | 'change';

interface Props {
  isOpen: boolean;
  mode: VaultModalMode;
  onClose: () => void;
  onSuccess: () => void;
}

export const VaultPinModal: React.FC<Props> = ({ isOpen, mode, onClose, onSuccess }) => {
  const { t } = useTranslation();
  const [pin, setPin] = useState('');
  const [stage, setStage] = useState<'enter' | 'confirm' | 'current' | 'new' | 'confirm_new'>('enter');
  const [tempFirstPin, setTempFirstPin] = useState('');
  const [currentPinAttempt, setCurrentPinAttempt] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [shake, setShake] = useState(false);
  const [effectiveMode, setEffectiveMode] = useState<VaultModalMode>(mode);

  useEffect(() => {
    if (isOpen) {
      setPin('');
      setErrorMessage('');
      setTempFirstPin('');
      setCurrentPinAttempt('');

      // Verify if a PIN actually exists when opening
      vaultIpc.hasVaultPin().then((exists) => {
        if (!exists && mode === 'unlock') {
          setEffectiveMode('setup');
          setStage('enter');
        } else {
          setEffectiveMode(mode);
          setStage(mode === 'change' ? 'current' : 'enter');
        }
      });
    }
  }, [isOpen, mode]);

  const triggerError = useCallback((msg: string) => {
    setErrorMessage(msg);
    setShake(true);
    setTimeout(() => {
      setShake(false);
      setPin('');
    }, 500);
  }, []);

  const handleSubmit = useCallback(async () => {
    if (pin.length < 4) {
      if (effectiveMode === 'unlock' || stage === 'current') {
        triggerError(t('vault.invalidPin') || 'PIN incorrecto');
      } else {
        triggerError(t('vault.pinMinLength') || 'Mínimo 4 dígitos requeridos');
      }
      return;
    }

    if (effectiveMode === 'unlock') {
      const ok = await vaultIpc.verifyVaultPin(pin);
      if (ok) {
        onSuccess();
        onClose();
      } else {
        triggerError(t('vault.invalidPin') || 'PIN incorrecto');
      }
    } else if (effectiveMode === 'setup') {
      if (stage === 'enter') {
        setTempFirstPin(pin);
        setPin('');
        setStage('confirm');
      } else if (stage === 'confirm') {
        if (pin !== tempFirstPin) {
          triggerError(t('vault.pinMismatch') || 'Los PINs no coinciden');
          setStage('enter');
          setTempFirstPin('');
        } else {
          try {
            await vaultIpc.setVaultPin(null, pin);
            onSuccess();
            onClose();
          } catch {
            triggerError(t('vault.invalidPin') || 'PIN inválido');
          }
        }
      }
    } else if (effectiveMode === 'change') {
      if (stage === 'current') {
        const ok = await vaultIpc.verifyVaultPin(pin);
        if (ok) {
          setCurrentPinAttempt(pin);
          setPin('');
          setStage('new');
        } else {
          triggerError(t('vault.invalidPin') || 'PIN incorrecto');
        }
      } else if (stage === 'new') {
        setTempFirstPin(pin);
        setPin('');
        setStage('confirm_new');
      } else if (stage === 'confirm_new') {
        if (pin !== tempFirstPin) {
          triggerError(t('vault.pinMismatch') || 'Los PINs no coinciden');
          setStage('new');
          setTempFirstPin('');
        } else {
          try {
            await vaultIpc.setVaultPin(currentPinAttempt, pin);
            onSuccess();
            onClose();
          } catch {
            triggerError(t('vault.invalidPin') || 'PIN inválido');
          }
        }
      }
    }
  }, [pin, effectiveMode, stage, tempFirstPin, currentPinAttempt, onSuccess, onClose, triggerError, t]);

  const handleInputDigit = useCallback((digit: string) => {
    if (pin.length < 12) {
      setPin((prev) => prev + digit);
      setErrorMessage('');
    }
  }, [pin.length]);

  const handleDeleteDigit = useCallback(() => {
    setPin((prev) => prev.slice(0, -1));
    setErrorMessage('');
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      else if (e.key === 'Backspace') handleDeleteDigit();
      else if (e.key === 'Enter') handleSubmit();
      else if (/^\d$/.test(e.key)) handleInputDigit(e.key);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, handleDeleteDigit, handleInputDigit, handleSubmit]);

  if (!isOpen) return null;

  const getHeaderInfo = () => {
    if (effectiveMode === 'unlock') return { title: t('vault.unlockTitle'), sub: t('vault.enterPin') };
    if (effectiveMode === 'setup') {
      return {
        title: t('vault.setupTitle'),
        sub: stage === 'enter' ? t('vault.enterNewPin') : t('vault.confirmPin'),
      };
    }
    return {
      title: t('vault.changeTitle'),
      sub:
        stage === 'current'
          ? t('vault.enterCurrentPin')
          : stage === 'new'
          ? t('vault.enterNewPin')
          : t('vault.confirmPin'),
    };
  };

  const { title, sub } = getHeaderInfo();
  const isExistingPinCheck = effectiveMode === 'unlock' || stage === 'current';
  const canSubmit = isExistingPinCheck ? pin.length >= 1 : pin.length >= 4 && pin.length <= 12;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 select-none"
    >
      <motion.div
        onClick={(e) => e.stopPropagation()}
        animate={shake ? { x: [-10, 10, -8, 8, -4, 4, 0] } : {}}
        transition={{ duration: 0.4 }}
        className="w-full max-w-xs bg-theme-sidebar border border-theme-border rounded-2xl shadow-2xl p-6 flex flex-col items-center relative overflow-hidden"
      >
        <button
          onClick={onClose}
          className="absolute top-3.5 right-3.5 p-1 rounded-lg text-theme-muted hover:text-theme-text hover:bg-theme-hover transition-colors"
        >
          <X size={16} />
        </button>

        <div className="w-12 h-12 rounded-2xl bg-theme-accent/15 border border-theme-accent/30 text-theme-accent flex items-center justify-center mb-3">
          {effectiveMode === 'unlock' ? <Lock size={22} /> : <KeyRound size={22} />}
        </div>

        <h3 className="text-sm font-bold text-theme-text">{title}</h3>
        <p className="text-xs text-theme-muted mt-1 text-center">{sub}</p>

        {/* Dynamic PIN Dots & Display */}
        <div className="flex flex-col items-center my-4 w-full">
          <div className="h-10 px-4 py-1.5 rounded-xl bg-theme-column/60 border border-theme-border/60 flex items-center justify-center space-x-1.5 min-w-[140px] max-w-full">
            {pin.length === 0 ? (
              <span className="text-xs text-theme-muted/50 font-mono tracking-widest">••••</span>
            ) : (
              Array.from({ length: pin.length }).map((_, i) => (
                <span key={i} className="w-2.5 h-2.5 rounded-full bg-theme-accent inline-block shadow-xs animate-in zoom-in-75 duration-100" />
              ))
            )}
          </div>
          {!isExistingPinCheck && (
            <div className="text-[11px] text-theme-muted mt-1.5 font-medium">
              {pin.length < 4
                ? t('vault.pinMinLength') || 'Mínimo 4 dígitos'
                : `${pin.length} / 12 dígitos`}
            </div>
          )}
        </div>

        {/* Error message */}
        <AnimatePresence>
          {errorMessage && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              className="flex items-center space-x-1.5 text-rose-400 text-xs mb-3 font-medium text-center"
            >
              <AlertCircle size={13} />
              <span>{errorMessage}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* On-screen Numeric Keypad */}
        <div className="grid grid-cols-3 gap-2 w-full max-w-[210px]">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => handleInputDigit(n)}
              className="h-11 rounded-xl bg-theme-card hover:bg-theme-hover border border-theme-border/60 text-theme-text font-semibold text-sm transition-all active:scale-95 shadow-xs flex items-center justify-center"
            >
              {n}
            </button>
          ))}
          <button
            type="button"
            onClick={handleDeleteDigit}
            className="h-11 rounded-xl bg-theme-card/60 hover:bg-theme-hover border border-theme-border/60 text-theme-muted hover:text-rose-400 transition-all active:scale-95 flex items-center justify-center"
          >
            <Delete size={15} />
          </button>
          <button
            type="button"
            onClick={() => handleInputDigit('0')}
            className="h-11 rounded-xl bg-theme-card hover:bg-theme-hover border border-theme-border/60 text-theme-text font-semibold text-sm transition-all active:scale-95 shadow-xs flex items-center justify-center"
          >
            0
          </button>
          <button
            type="button"
            disabled={!canSubmit}
            onClick={handleSubmit}
            className={`h-11 rounded-xl border font-semibold text-xs transition-all active:scale-95 shadow-xs flex items-center justify-center ${
              canSubmit
                ? 'bg-theme-accent text-white border-transparent cursor-pointer hover:bg-theme-accent/90'
                : 'bg-theme-card/40 text-theme-muted/40 border-theme-border/40 cursor-not-allowed'
            }`}
          >
            <CornerDownLeft size={15} />
          </button>
        </div>
      </motion.div>
    </div>
  );
};
