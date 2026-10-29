import React, { useState } from 'react';
import { Volume2, VolumeX, Mic, Play } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { CustomSelect } from '../shared/ui/CustomSelect';
import { useAudioDevices } from '../shared/hooks/useAudioDevices';

interface Props {
  isAudioMuted: boolean;
  audioVolume: number;
  onVolumeChange: (vol: number) => void;
  onToggleAudioMute: () => void;
}

export const AudioSettingsTab: React.FC<Props> = ({
  isAudioMuted,
  audioVolume,
  onVolumeChange,
  onToggleAudioMute,
}) => {
  const { t } = useTranslation();
  const [micTestError, setMicTestError] = useState<string | null>(null);

  const {
    inputDevices,
    outputDevices,
    selectedInputId,
    selectedOutputId,
    changeInputDevice,
    changeOutputDevice,
    playTestSound,
    startMicTest,
    isTestingMic,
    micLevel,
  } = useAudioDevices();

  const handleTestMicClick = async () => {
    setMicTestError(null);
    try {
      await startMicTest();
    } catch {
      setMicTestError(t('voiceRecorder.microphonePermissionError'));
    }
  };

  return (
    <div className="space-y-4">
      <p className="text-xs text-theme-muted">
        {t('settings.audioDevicesDesc')}
      </p>

      {/* Master Volume & Mute */}
      <div className="p-3.5 rounded-xl bg-theme-card/60 border border-white/[0.06] space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-theme-text flex items-center space-x-1.5">
            {isAudioMuted ? (
              <VolumeX size={14} className="text-theme-muted" />
            ) : (
              <Volume2 size={14} className="text-theme-accent" />
            )}
            <span>{t('settings.masterVolume')}</span>
          </span>
          <button
            type="button"
            onClick={onToggleAudioMute}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer border ${
              isAudioMuted
                ? 'bg-red-500/15 text-red-400 border-red-500/30'
                : 'bg-theme-base text-theme-muted hover:text-theme-text border-white/[0.06]'
            }`}
          >
            {isAudioMuted ? t('settings.unmuteAudio') : t('settings.muteAudio')}
          </button>
        </div>

        <div className="flex items-center space-x-3">
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={isAudioMuted ? 0 : audioVolume}
            onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
            disabled={isAudioMuted}
            className="flex-1 h-1.5 bg-theme-base rounded-lg accent-theme-accent cursor-pointer disabled:opacity-40"
          />
          <span className="text-xs font-mono text-theme-muted w-10 text-right">
            {isAudioMuted ? '0%' : `${Math.round(audioVolume * 100)}%`}
          </span>
        </div>
      </div>

      {/* Microphone Input Device */}
      <div className="p-3.5 rounded-xl bg-theme-card/60 border border-white/[0.06] space-y-2.5">
        <label className="text-xs font-medium text-theme-text flex items-center space-x-1.5">
          <Mic size={14} className="text-red-400" />
          <span>{t('audioSettings.inputDevice')}</span>
        </label>

        <CustomSelect
          value={selectedInputId}
          onChange={changeInputDevice}
          placeholder={t('audioSettings.defaultInput')}
          options={[
            { value: '', label: t('audioSettings.defaultInput') },
            ...inputDevices.map((d) => ({ value: d.id, label: d.name })),
          ]}
        />

        {/* Mic Test Button & Meter */}
        <div className="flex items-center justify-between pt-1">
          <button
            type="button"
            onClick={handleTestMicClick}
            disabled={isTestingMic}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-theme-card hover:bg-theme-hover text-theme-muted hover:text-theme-text border border-white/[0.06] text-xs transition-colors cursor-pointer disabled:opacity-50"
          >
            <Mic size={13} className={isTestingMic ? 'text-red-400 animate-pulse' : ''} />
            <span>{isTestingMic ? t('audioSettings.testingMic') : t('audioSettings.testMic')}</span>
          </button>

          {isTestingMic && (
            <div className="flex items-center space-x-2 flex-1 max-w-[180px] ml-4">
              <div className="flex-1 h-2 bg-theme-base rounded-full overflow-hidden border border-white/[0.06]">
                <div
                  className="h-full bg-emerald-500 transition-all duration-75"
                  style={{ width: `${micLevel}%` }}
                />
              </div>
              <span className="text-xs font-mono text-emerald-400 font-bold">{micLevel}%</span>
            </div>
          )}
        </div>

        {micTestError && (
          <p className="text-xs text-red-400 mt-1">{micTestError}</p>
        )}
      </div>

      {/* Speaker Output Device */}
      <div className="p-3.5 rounded-xl bg-theme-card/60 border border-white/[0.06] space-y-2.5">
        <label className="text-xs font-medium text-theme-text flex items-center space-x-1.5">
          <Volume2 size={14} className="text-theme-accent" />
          <span>{t('audioSettings.outputDevice')}</span>
        </label>

        <CustomSelect
          value={selectedOutputId}
          onChange={changeOutputDevice}
          placeholder={t('audioSettings.defaultOutput')}
          options={[
            { value: '', label: t('audioSettings.defaultOutput') },
            ...outputDevices.map((d) => ({ value: d.id, label: d.name })),
          ]}
        />

        <div className="pt-1">
          <button
            type="button"
            onClick={playTestSound}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-theme-card hover:bg-theme-hover text-theme-muted hover:text-theme-text border border-white/[0.06] text-xs transition-colors cursor-pointer"
          >
            <Play size={12} className="fill-current text-theme-accent" />
            <span>{t('audioSettings.testSound')}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
