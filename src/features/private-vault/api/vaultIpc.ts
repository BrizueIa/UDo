const isTauri = typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;
const WEB_PIN_KEY = 'udo_vault_pin_hash';

export const vaultIpc = {
  async hasVaultPin(): Promise<boolean> {
    if (isTauri) {
      try {
        const { invoke } = await import('@tauri-apps/api/core');
        return await invoke<boolean>('has_vault_pin');
      } catch (err) {
        console.warn('Tauri has_vault_pin failed, using local storage fallback', err);
      }
    }
    const val = localStorage.getItem(WEB_PIN_KEY);
    return !!val && val.length > 0;
  },

  async verifyVaultPin(pin: string): Promise<boolean> {
    if (isTauri) {
      try {
        const { invoke } = await import('@tauri-apps/api/core');
        return await invoke<boolean>('verify_vault_pin', { pin });
      } catch (err) {
        console.warn('Tauri verify_vault_pin failed, using local storage fallback', err);
      }
    }
    const stored = localStorage.getItem(WEB_PIN_KEY);
    if (!stored) return false;
    return stored === btoa(`udo_${pin}_salt`);
  },

  async setVaultPin(currentPin: string | null, newPin: string): Promise<boolean> {
    if (isTauri) {
      try {
        const { invoke } = await import('@tauri-apps/api/core');
        return await invoke<boolean>('set_vault_pin', {
          currentPin: currentPin || undefined,
          newPin,
        });
      } catch (err) {
        console.warn('Tauri set_vault_pin failed, using local storage fallback', err);
        throw err;
      }
    }

    const stored = localStorage.getItem(WEB_PIN_KEY);
    if (stored) {
      if (!currentPin || stored !== btoa(`udo_${currentPin}_salt`)) {
        throw new Error('Current PIN is incorrect');
      }
    }

    if (newPin.length < 4 || newPin.length > 12 || !/^\d{4,12}$/.test(newPin)) {
      throw new Error('PIN must be between 4 and 12 digits');
    }

    localStorage.setItem(WEB_PIN_KEY, btoa(`udo_${newPin}_salt`));
    return true;
  },
};
