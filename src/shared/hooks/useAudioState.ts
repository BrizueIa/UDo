import { useState, useCallback } from 'react';
import {
  isAudioMuted,
  toggleAudioMute,
  getAudioVolume,
  setAudioVolume,
  setAudioMuted,
} from '../utils/soundEffects';

export function useAudioState() {
  const [soundMuted, setSoundMuted] = useState(() => isAudioMuted());
  const [soundVolume, setSoundVolume] = useState(() => getAudioVolume());

  const handleToggleAudioMute = useCallback(() => {
    setSoundMuted(toggleAudioMute());
  }, []);

  const handleVolumeChange = useCallback((vol: number) => {
    setAudioVolume(vol);
    setSoundVolume(vol);
    if (isAudioMuted() && vol > 0) {
      setAudioMuted(false);
      setSoundMuted(false);
    }
  }, []);

  return {
    soundMuted,
    soundVolume,
    handleToggleAudioMute,
    handleVolumeChange,
  };
}
