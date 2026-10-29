import React, { useState } from 'react';
import {
  Volume2,
  VolumeX,
  Mic,
  Play,
  Sparkles,
  Keyboard,
  MousePointer,
  CheckCircle2,
  Bell,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { CustomSelect } from '../shared/ui/CustomSelect';
import { useAudioDevices } from '../shared/hooks/useAudioDevices';
import {
  isKeyboardSoundEnabled,
  setKeyboardSoundEnabled,
  isClickSoundEnabled,
  setClickSoundEnabled,
  isCompletionSoundEnabled,
  setCompletionSoundEnabled,
  isTimerSoundEnabled,
  setTimerSoundEnabled,
  playKeyboardClickSound,
  playUiClickSound,
  playTaskCompleteSound,
  playTimerCompleteSound,
} from '../shared/utils/soundEffects';

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

  // Opera GX Style Sound Effect States
  const [keyboardSound, setKeyboardSound] = useState(() => isKeyboardSoundEnabled());
  const [clickSound, setClickSound] = useState(() => isClickSoundEnabled());
  const [completionSound, setCompletionSound] = useState(() => isCompletionSoundEnabled());
  const [timerSound, setTimerSound] = useState(() => isTimerSoundEnabled());

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

  const handleToggleKeyboard = () => {
    const next = !keyboardSound;
    setKeyboardSound(next);
    setKeyboardSoundEnabled(next);
    if (next) playKeyboardClickSound(true);
  };

  const handleToggleClick = () => {
    const next = !clickSound;
    setClickSound(next);
    setClickSoundEnabled(next);
    if (next) playUiClickSound(true);
  };

  const handleToggleCompletion = () => {
    const next = !completionSound;
    setCompletionSound(next);
    setCompletionSoundEnabled(next);
    if (next) playTaskCompleteSound(true);
  };

  const handleToggleTimer = () => {
    const next = !timerSound;
    setTimerSound(next);
    setTimerSoundEnabled(next);
    if (next) playTimerCompleteSound(true);
  };

  const gxSoundItems = [
    {
      id: 'keyboard',
      title: t('settings.soundKeyboard'),
      desc: t('settings.soundKeyboardDesc'),
      icon: <Keyboard size={14} className="text-theme-accent" />,
      enabled: keyboardSound,
      onToggle: handleToggleKeyboard,
      onTest: () => playKeyboardClickSound(true),
    },
    {
      id: 'click',
      title: t('settings.soundClick'),
      desc: t('settings.soundClickDesc'),
      icon: <MousePointer size={14} className="text-theme-accent" />,
      enabled: clickSound,
      onToggle: handleToggleClick,
      onTest: () => playUiClickSound(true),
    },
    {
      id: 'completion',
      title: t('settings.soundCompletion'),
      desc: t('settings.soundCompletionDesc'),
      icon: <CheckCircle2 size={14} className="text-emerald-400" />,
      enabled: completionSound,
      onToggle: handleToggleCompletion,
      onTest: () => playTaskCompleteSound(true),
    },
    {
      id: 'timer',
      title: t('settings.soundTimer'),
      desc: t('settings.soundTimerDesc'),
      icon: <Bell size={14} className="text-amber-400" />,
      enabled: timerSound,
      onToggle: handleToggleTimer,
      onTest: () => playTimerCompleteSound(true),
    },
  ];

  return (
    <div className="space-y-4">
      {/* Master Volume & Mute */}
      <div className="p-3.5 rounded-xl bg-theme-card/60 border border-white/[0.06] space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-theme-text flex items-center space-x-1.5">
            {isAudioMuted ? (
              <VolumeX size={15} className="text-theme-muted" />
            ) : (
              <Volume2 size={15} className="text-theme-accent" />
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
            className="flex-1 audio-seek-slider disabled:opacity-40"
          />
          <span className="text-xs font-mono text-theme-muted w-10 text-right">
            {isAudioMuted ? '0%' : `${Math.round(audioVolume * 100)}%`}
          </span>
        </div>
      </div>

      {/* Opera GX Style Sound Effects */}
      <div className="p-3.5 rounded-xl bg-theme-card/60 border border-white/[0.06] space-y-3">
        <div className="space-y-0.5">
          <div className="flex items-center space-x-1.5 text-xs font-semibold text-theme-text">
            <Sparkles size={14} className="text-theme-accent" />
            <span>{t('settings.gxAudioTitle')}</span>
          </div>
          <p className="text-[11px] text-theme-muted">
            {t('settings.gxAudioDesc')}
          </p>
        </div>

        <div className="space-y-2 pt-1">
          {gxSoundItems.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between p-2.5 rounded-xl bg-theme-column/50 hover:bg-theme-column/80 border border-white/[0.04] transition-colors"
            >
              <div className="flex items-center space-x-2.5 min-w-0 mr-3">
                <span className="shrink-0">{item.icon}</span>
                <div className="min-w-0">
                  <div className="text-xs font-medium text-theme-text truncate">
                    {item.title}
                  </div>
                  <div className="text-[10px] text-theme-muted truncate">
                    {item.desc}
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-2 shrink-0">
                <button
                  type="button"
                  onClick={item.onTest}
                  disabled={isAudioMuted}
                  className="flex items-center space-x-1 px-2 py-1 rounded-md bg-theme-card hover:bg-theme-hover text-theme-muted hover:text-theme-text border border-white/[0.05] text-[10px] transition-colors cursor-pointer disabled:opacity-40"
                  title={t('settings.soundTest')}
                >
                  <Play size={10} className="fill-current text-theme-accent" />
                  <span>{t('settings.soundTest')}</span>
                </button>

                {/* Toggle switch */}
                <button
                  type="button"
                  onClick={item.onToggle}
                  className={`w-9 h-5 flex items-center rounded-full p-0.5 transition-colors cursor-pointer ${
                    item.enabled ? 'bg-theme-accent' : 'bg-white/10'
                  }`}
                >
                  <div
                    className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                      item.enabled ? 'translate-x-4' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Microphone Input Device */}
      <div className="p-3.5 rounded-xl bg-theme-card/60 border border-white/[0.06] space-y-2.5">
        <label className="text-xs font-semibold text-theme-text flex items-center space-x-1.5">
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
        <label className="text-xs font-semibold text-theme-text flex items-center space-x-1.5">
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
