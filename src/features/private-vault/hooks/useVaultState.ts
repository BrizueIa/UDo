import { useState, useEffect, useCallback } from 'react';
import { vaultIpc } from '../api/vaultIpc';
import { VaultModalMode } from '../components/VaultPinModal';

export function useVaultState() {
  const [isVaultUnlocked, setIsVaultUnlocked] = useState(false);
  const [hasPin, setHasPin] = useState(false);
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [pinModalMode, setPinModalMode] = useState<VaultModalMode>('unlock');

  const checkHasPin = useCallback(async () => {
    try {
      const exists = await vaultIpc.hasVaultPin();
      setHasPin(exists);
      return exists;
    } catch {
      setHasPin(false);
      return false;
    }
  }, []);

  useEffect(() => {
    checkHasPin();
  }, [checkHasPin]);

  const lockVault = useCallback(() => {
    setIsVaultUnlocked(false);
  }, []);

  const openUnlockOrSetup = useCallback(async () => {
    const exists = await checkHasPin();
    setPinModalMode(exists ? 'unlock' : 'setup');
    setIsPinModalOpen(true);
  }, [checkHasPin]);

  const openChangePin = useCallback(() => {
    setPinModalMode('change');
    setIsPinModalOpen(true);
  }, []);

  const handleToggleVault = useCallback(() => {
    if (isVaultUnlocked) {
      lockVault();
    } else {
      openUnlockOrSetup();
    }
  }, [isVaultUnlocked, lockVault, openUnlockOrSetup]);

  // Global shortcut Ctrl+L to toggle/lock vault
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'l') {
        e.preventDefault();
        handleToggleVault();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleToggleVault]);

  const handleModalSuccess = useCallback(() => {
    if (pinModalMode === 'unlock' || pinModalMode === 'setup') {
      setIsVaultUnlocked(true);
    }
    checkHasPin();
  }, [pinModalMode, checkHasPin]);

  return {
    isVaultUnlocked,
    hasPin,
    isPinModalOpen,
    pinModalMode,
    setIsPinModalOpen,
    lockVault,
    openUnlockOrSetup,
    openChangePin,
    handleToggleVault,
    handleModalSuccess,
    checkHasPin,
  };
}
