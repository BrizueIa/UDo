import React, { useState, useEffect, useCallback } from 'react';
import { Lock, KeyRound, Delete, X, AlertCircle } from 'lucide-react';
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
  const [stage, setStage] = useState<'enter' | 'confirm' | 'current' | 'new'>('enter');
  const [tempFirstPin, setTempFirstPin] = useState('');
  const [currentPinAttempt, setCurrentPinAttempt] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [shake, setShake] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setPin('');
      setErrorMessage('');
      setTempFirstPin('');
      setCurrentPinAttempt('');
      setStage(mode === 'change' ? 'current' : 'enter');
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

  const handleCompletePin = useCallback(
    async (completedPin: string) => {
      if (mode === 'unlock') {
        const ok = await vaultIpc.verifyVaultPin(completedPin);
        if (ok) {
          onSuccess();
          onClose();
        } else {
          triggerError(t('vault.invalidPin'));
        }
      } else if (mode === 'setup') {
        if (stage === 'enter') {
          setTempFirstPin(completedPin);
          setPin('');
          setStage('confirm');
        } else if (stage === 'confirm') {
          if (completedPin !== tempFirstPin) {
            triggerError(t('vault.pinMismatch'));
            setStage('enter');
            setTempFirstPin('');
          } else {
            try {
              await vaultIpc.setVaultPin(null, completedPin);
              onSuccess();
              onClose();
            } catch {
              triggerError(t('vault.invalidPin'));
            }
          }
        }
      } else if (mode === 'change') {
        if (stage === 'current') {
          const ok = await vaultIpc.verifyVaultPin(completedPin);
          if (ok) {
            setCurrentPinAttempt(completedPin);
            setPin('');
            setStage('new');
          } else {
            triggerError(t('vault.invalidPin'));
          }
        } else if (stage === 'new') {
          try {
            await vaultIpc.setVaultPin(currentPinAttempt, completedPin);
            onSuccess();
            onClose();
          } catch {
            triggerError(t('vault.invalidPin'));
          }
        }
      }
    },
    [mode, stage, tempFirstPin, currentPinAttempt, onSuccess, onClose, triggerError, t]
  );

  const handleInputDigit = useCallback(
    (digit: string) => {
      if (pin.length < 6) {
        const next = pin + digit;
        setPin(next);
        setErrorMessage('');
        if (next.length === 6) {
          setTimeout(() => handleCompletePin(next), 80);
        }
      }
    },
    [pin, handleCompletePin]
  );

  const handleDeleteDigit = useCallback(() => {
    setPin((prev) => prev.slice(0, -1));
    setErrorMessage('');
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      else if (e.key === 'Backspace') handleDeleteDigit();
      else if (/^\d$/.test(e.key)) handleInputDigit(e.key);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, handleDeleteDigit, handleInputDigit]);

  if (!isOpen) return null;

  const getHeaderInfo = () => {
    if (mode === 'unlock') return { title: t('vault.unlockTitle'), sub: t('vault.enterPin') };
    if (mode === 'setup') {
      return {
        title: t('vault.setupTitle'),
        sub: stage === 'enter' ? t('vault.enterNewPin') : t('vault.confirmPin'),
      };
    }
    return {
      title: t('vault.changeTitle'),
      sub: stage === 'current' ? t('vault.enterCurrentPin') : t('vault.enterNewPin'),
    };
  };

  const { title, sub } = getHeaderInfo();

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
          {mode === 'unlock' ? <Lock size={22} /> : <KeyRound size={22} />}
        </div>

        <h3 className="text-sm font-bold text-theme-text">{title}</h3>
        <p className="text-xs text-theme-muted mt-1 text-center">{sub}</p>

        {/* 6 Digit Display Boxes */}
        <div className="flex items-center space-x-2 my-5">
          {Array.from({ length: 6 }).map((_, i) => {
            const hasDigit = i < pin.length;
            return (
              <div
                key={i}
                className={`w-9 h-11 rounded-lg border flex items-center justify-center text-lg font-semibold transition-all ${
                  hasDigit
                    ? 'border-theme-accent bg-theme-card text-theme-text shadow-xs'
                    : 'border-theme-border/70 bg-theme-column text-transparent'
                }`}
              >
                {hasDigit ? '•' : ''}
              </div>
            );
          })}
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
            onClick={() => setPin('')}
            className="h-11 rounded-xl bg-theme-card/60 hover:bg-theme-hover border border-theme-border/60 text-theme-muted text-[11px] font-medium transition-all active:scale-95 flex items-center justify-center"
          >
            {t('nav.clearFilter') || 'Clear'}
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
            onClick={handleDeleteDigit}
            className="h-11 rounded-xl bg-theme-card/60 hover:bg-theme-hover border border-theme-border/60 text-theme-muted hover:text-rose-400 transition-all active:scale-95 flex items-center justify-center"
          >
            <Delete size={15} />
          </button>
        </div>
      </motion.div>
    </div>
  );
};
