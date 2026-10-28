import React, { useState } from 'react';
import { Timer, Play, Pause, Square, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { FocusTimerState } from '../../../shared/hooks/useFocusTimer';

interface Props {
  isOpen: boolean;
  noteId: string;
  noteTitle: string;
  timer: FocusTimerState;
  onClose: () => void;
}

export const FocusTimerPopover: React.FC<Props> = ({
  isOpen,
  noteId,
  noteTitle,
  timer,
  onClose,
}) => {
  const { t } = useTranslation();
  const [selectedMinutes, setSelectedMinutes] = useState<number>(25);
  const [customInput, setCustomInput] = useState<string>('30');
  const [isCustomMode, setIsCustomMode] = useState<boolean>(false);

  if (!isOpen) return null;

  const isOtherNoteSprint = timer.isRunning && timer.noteId !== noteId;

  const handleStart = () => {
    const mins = isCustomMode ? Math.max(1, parseInt(customInput, 10) || 25) : selectedMinutes;
    timer.startSprint(noteId, noteTitle, mins);
  };

  const presets = [
    { mins: 15, label: t('focusTimer.preset15') },
    { mins: 25, label: t('focusTimer.preset25') },
    { mins: 45, label: t('focusTimer.preset45') },
  ];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: -10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -10 }}
          transition={{ type: 'spring', stiffness: 400, damping: 28 }}
          className="w-full max-w-sm bg-theme-base border border-white/[0.08] rounded-2xl shadow-2xl p-5 overflow-hidden text-theme-text select-none"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
            <div className="flex items-center space-x-2">
              <span className="p-1.5 rounded-lg bg-theme-accent/20 text-theme-accent">
                <Timer size={16} />
              </span>
              <h3 className="text-sm font-bold tracking-tight">{t('focusTimer.title')}</h3>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-md text-theme-muted hover:text-theme-text hover:bg-theme-card transition-colors cursor-pointer"
            >
              <X size={15} />
            </button>
          </div>

          {/* Note Context */}
          <div className="mt-3 px-3 py-2 rounded-xl bg-theme-card/60 border border-white/[0.04]">
            <p className="text-[11px] font-medium text-theme-muted uppercase tracking-wider">
              {t('note.sheetContent')}
            </p>
            <p className="text-xs font-semibold text-theme-text truncate mt-0.5">
              {isOtherNoteSprint ? timer.noteTitle : noteTitle}
            </p>
          </div>

          {/* Sprint Active View */}
          {timer.isRunning ? (
            <div className="mt-4 flex flex-col items-center">
              <span
                className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full mb-1 ${
                  timer.isPaused
                    ? 'bg-amber-500/20 text-amber-400'
                    : 'bg-emerald-500/20 text-emerald-400'
                }`}
              >
                {timer.isPaused ? t('focusTimer.paused') : t('focusTimer.running')}
              </span>

              {/* Big Time Display */}
              <div className="text-4xl font-mono font-extrabold tracking-tight my-2 text-theme-text">
                {timer.formattedTime}
              </div>

              {/* Progress bar */}
              <div className="w-full h-1.5 bg-theme-card rounded-full overflow-hidden my-2 border border-white/[0.05]">
                <div
                  className="h-full bg-theme-accent transition-all duration-500"
                  style={{ width: `${timer.progressPercent}%` }}
                />
              </div>

              {/* Controls */}
              <div className="flex items-center space-x-2 mt-4">
                {timer.isPaused ? (
                  <button
                    onClick={timer.resumeSprint}
                    className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-theme-accent text-white text-xs font-semibold hover:bg-theme-accent-hover transition-colors shadow-sm cursor-pointer"
                  >
                    <Play size={14} className="fill-white" />
                    <span>{t('focusTimer.resume')}</span>
                  </button>
                ) : (
                  <button
                    onClick={timer.pauseSprint}
                    className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-semibold hover:bg-amber-500/30 transition-colors shadow-sm cursor-pointer"
                  >
                    <Pause size={14} />
                    <span>{t('focusTimer.pause')}</span>
                  </button>
                )}

                <button
                  onClick={timer.stopSprint}
                  className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-theme-card text-theme-muted hover:text-red-400 hover:bg-red-500/10 border border-white/[0.06] text-xs font-semibold transition-colors cursor-pointer"
                >
                  <Square size={13} />
                  <span>{t('focusTimer.stop')}</span>
                </button>
              </div>
            </div>
          ) : (
            /* Configure New Sprint View */
            <div className="mt-4 space-y-3">
              <div className="grid grid-cols-3 gap-2">
                {presets.map((p) => {
                  const isSelected = !isCustomMode && selectedMinutes === p.mins;
                  return (
                    <button
                      key={p.mins}
                      onClick={() => {
                        setSelectedMinutes(p.mins);
                        setIsCustomMode(false);
                      }}
                      className={`flex flex-col items-center justify-center py-2.5 px-1 rounded-xl text-xs font-semibold transition-all border cursor-pointer ${
                        isSelected
                          ? 'bg-theme-accent text-white border-transparent shadow-sm'
                          : 'bg-theme-card hover:bg-theme-hover text-theme-text border-white/[0.05]'
                      }`}
                    >
                      <span>{p.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Custom Minutes Input */}
              <div className="flex items-center space-x-2 pt-1">
                <button
                  onClick={() => setIsCustomMode(true)}
                  className={`text-xs px-2.5 py-1.5 rounded-lg border transition-colors cursor-pointer ${
                    isCustomMode
                      ? 'bg-theme-card border-theme-accent text-theme-text font-bold'
                      : 'text-theme-muted hover:text-theme-text border-transparent'
                  }`}
                >
                  {t('focusTimer.custom')}:
                </button>
                <input
                  type="number"
                  min="1"
                  max="180"
                  value={customInput}
                  onChange={(e) => {
                    setIsCustomMode(true);
                    setCustomInput(e.target.value);
                  }}
                  onFocus={() => setIsCustomMode(true)}
                  className="w-20 bg-theme-card px-2.5 py-1 text-xs text-theme-text rounded-lg border border-white/[0.08] focus:border-theme-accent outline-none text-center font-mono"
                />
                <span className="text-xs text-theme-muted">{t('focusTimer.customMinutes')}</span>
              </div>

              {/* Start Button */}
              <button
                onClick={handleStart}
                className="w-full flex items-center justify-center space-x-2 py-2.5 rounded-xl bg-theme-accent text-white text-xs font-bold hover:bg-theme-accent-hover transition-colors shadow-md cursor-pointer mt-2"
              >
                <Play size={14} className="fill-white" />
                <span>{t('focusTimer.start')}</span>
              </button>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
