import React, { useState } from 'react';
import { X, Mic, Volume2, Play, CheckCircle2, Sliders } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAudioDevices } from '../../../shared/hooks/useAudioDevices';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const AudioDeviceSettingsModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const { t } = useTranslation();
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

  const [micTestError, setMicTestError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleTestMicClick = async () => {
    setMicTestError(null);
    try {
      await startMicTest();
    } catch {
      setMicTestError(t('voiceRecorder.microphonePermissionError'));
    }
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 select-none animate-in fade-in duration-100"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md bg-theme-sidebar border border-theme-border rounded-2xl shadow-2xl p-5 space-y-5"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-theme-border">
          <div className="flex items-center space-x-2 text-theme-text font-semibold text-sm">
            <Sliders size={17} className="text-theme-accent" />
            <span>{t('audioSettings.title')}</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-theme-muted hover:text-theme-text hover:bg-theme-hover transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Input Device (Microphone) */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-theme-text flex items-center space-x-1.5">
            <Mic size={14} className="text-red-400" />
            <span>{t('audioSettings.inputDevice')}</span>
          </label>
          <select
            value={selectedInputId}
            onChange={(e) => changeInputDevice(e.target.value)}
            className="w-full bg-theme-card px-3 py-1.5 rounded-lg border border-theme-border text-xs text-theme-text outline-none focus:border-theme-accent cursor-pointer"
          >
            <option value="">{t('audioSettings.defaultInput')}</option>
            {inputDevices.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>

          {/* Mic Test Row */}
          <div className="flex items-center justify-between pt-1">
            <button
              type="button"
              onClick={handleTestMicClick}
              disabled={isTestingMic}
              className="flex items-center space-x-1.5 px-2.5 py-1 rounded bg-theme-card hover:bg-theme-hover text-theme-muted hover:text-theme-text border border-white/[0.05] text-[11px] transition-colors cursor-pointer disabled:opacity-50"
            >
              <Mic size={12} className={isTestingMic ? 'text-red-400 animate-pulse' : ''} />
              <span>{isTestingMic ? t('audioSettings.testingMic') : t('audioSettings.testMic')}</span>
            </button>

            {isTestingMic && (
              <div className="flex items-center space-x-2 flex-1 max-w-[160px] ml-3">
                <div className="flex-1 h-2 bg-theme-base rounded-full overflow-hidden border border-white/[0.05]">
                  <div
                    className="h-full bg-emerald-500 transition-all duration-75"
                    style={{ width: `${micLevel}%` }}
                  />
                </div>
                <span className="text-[10px] font-mono text-emerald-400 font-bold">{micLevel}%</span>
              </div>
            )}
          </div>

          {micTestError && (
            <p className="text-[11px] text-red-400 mt-1">{micTestError}</p>
          )}
        </div>

        {/* Output Device (Speakers) */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-theme-text flex items-center space-x-1.5">
            <Volume2 size={14} className="text-theme-accent" />
            <span>{t('audioSettings.outputDevice')}</span>
          </label>
          <select
            value={selectedOutputId}
            onChange={(e) => changeOutputDevice(e.target.value)}
            className="w-full bg-theme-card px-3 py-1.5 rounded-lg border border-theme-border text-xs text-theme-text outline-none focus:border-theme-accent cursor-pointer"
          >
            <option value="">{t('audioSettings.defaultOutput')}</option>
            {outputDevices.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>

          <div className="pt-1">
            <button
              type="button"
              onClick={playTestSound}
              className="flex items-center space-x-1.5 px-2.5 py-1 rounded bg-theme-card hover:bg-theme-hover text-theme-muted hover:text-theme-text border border-white/[0.05] text-[11px] transition-colors cursor-pointer"
            >
              <Play size={11} className="fill-current text-theme-accent" />
              <span>{t('audioSettings.testSound')}</span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end pt-3 border-t border-theme-border">
          <button
            type="button"
            onClick={onClose}
            className="flex items-center space-x-1.5 px-4 py-1.5 rounded-lg bg-theme-accent text-white font-medium hover:bg-theme-accent-hover text-xs transition-colors cursor-pointer shadow-sm"
          >
            <CheckCircle2 size={13} />
            <span>{t('audioSettings.done')}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
