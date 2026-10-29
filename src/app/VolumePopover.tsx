import React, { useState, useRef, useEffect } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { playTaskCompleteSound } from '../shared/utils/soundEffects';

interface Props {
  isAudioMuted: boolean;
  audioVolume: number;
  onVolumeChange: (vol: number) => void;
  onToggleAudioMute: () => void;
}

export const VolumePopover: React.FC<Props> = ({
  isAudioMuted,
  audioVolume,
  onVolumeChange,
  onToggleAudioMute,
}) => {
  const { t } = useTranslation();
  const [showPopover, setShowPopover] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setShowPopover(false);
      }
    };
    if (showPopover) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showPopover]);

  return (
    <div className="relative" ref={popoverRef}>
      <button
        onClick={() => setShowPopover(!showPopover)}
        className={`p-1.5 rounded-md transition-colors cursor-pointer ${
          isAudioMuted
            ? 'text-theme-muted/60 hover:text-theme-text hover:bg-theme-hover'
            : 'text-theme-accent hover:text-theme-accent-hover hover:bg-theme-hover'
        }`}
        title={isAudioMuted ? t('audio.unmute') : t('audio.mute')}
      >
        {isAudioMuted ? <VolumeX size={15} /> : <Volume2 size={15} />}
      </button>

      {showPopover && (
        <div className="absolute right-0 top-full mt-2 w-48 bg-theme-card border border-white/[0.1] rounded-xl shadow-2xl p-2.5 z-50 flex items-center space-x-2">
          <button
            type="button"
            onClick={onToggleAudioMute}
            className="p-1 rounded text-theme-muted hover:text-theme-text hover:bg-theme-hover transition-colors shrink-0 cursor-pointer"
            title={isAudioMuted ? t('audio.unmute') : t('audio.mute')}
          >
            {isAudioMuted ? (
              <VolumeX size={14} className="text-red-400" />
            ) : (
              <Volume2 size={14} className="text-theme-accent" />
            )}
          </button>
          <input
            type="range"
            min="0"
            max="100"
            value={isAudioMuted ? 0 : Math.round(audioVolume * 100)}
            onChange={(e) => onVolumeChange(Number(e.target.value) / 100)}
            onMouseUp={() => playTaskCompleteSound()}
            onTouchEnd={() => playTaskCompleteSound()}
            aria-label={t('audio.volume')}
            title={t('audio.volume')}
            className="w-full accent-theme-accent cursor-pointer h-1.5 bg-theme-base rounded-lg"
          />
          <span className="text-[10px] font-mono text-theme-muted w-7 text-right shrink-0">
            {isAudioMuted ? '0%' : `${Math.round(audioVolume * 100)}%`}
          </span>
        </div>
      )}
    </div>
  );
};
