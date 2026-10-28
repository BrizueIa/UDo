import { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { api } from '../api/ipc';
import { playTimerCompleteSound } from '../utils/soundEffects';

export interface FocusTimerState {
  noteId: string | null;
  noteTitle: string | null;
  durationMinutes: number;
  remainingSeconds: number;
  isRunning: boolean;
  isPaused: boolean;
  formattedTime: string;
  progressPercent: number;
  startSprint: (noteId: string, noteTitle: string, minutes: number) => void;
  pauseSprint: () => void;
  resumeSprint: () => void;
  stopSprint: () => void;
  resetSprint: () => void;
}

export function useFocusTimer(): FocusTimerState {
  const { t } = useTranslation();
  const [noteId, setNoteId] = useState<string | null>(null);
  const [noteTitle, setNoteTitle] = useState<string | null>(null);
  const [durationMinutes, setDurationMinutes] = useState<number>(25);
  const [remainingSeconds, setRemainingSeconds] = useState<number>(25 * 60);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);

  const timerRef = useRef<number | null>(null);

  const startSprint = useCallback((id: string, title: string, minutes: number) => {
    const totalSecs = Math.max(1, Math.round(minutes * 60));
    setNoteId(id);
    setNoteTitle(title);
    setDurationMinutes(minutes);
    setRemainingSeconds(totalSecs);
    setIsRunning(true);
    setIsPaused(false);
  }, []);

  const pauseSprint = useCallback(() => {
    setIsPaused(true);
  }, []);

  const resumeSprint = useCallback(() => {
    setIsPaused(false);
  }, []);

  const stopSprint = useCallback(() => {
    setIsRunning(false);
    setIsPaused(false);
    setRemainingSeconds(durationMinutes * 60);
  }, [durationMinutes]);

  const resetSprint = useCallback(() => {
    setIsRunning(false);
    setIsPaused(false);
    setNoteId(null);
    setNoteTitle(null);
    setRemainingSeconds(25 * 60);
    setDurationMinutes(25);
  }, []);

  // Tick interval
  useEffect(() => {
    if (isRunning && !isPaused) {
      timerRef.current = window.setInterval(() => {
        setRemainingSeconds((prev) => {
          if (prev <= 1) {
            // Sprint complete!
            window.clearInterval(timerRef.current!);
            timerRef.current = null;
            setIsRunning(false);
            setIsPaused(false);

            // Audio & Native Notification
            playTimerCompleteSound();
            const notificationTitle = t('focusTimer.finishedTitle');
            const notificationBody = t('focusTimer.finishedBody', {
              noteTitle: noteTitle || t('note.untitled'),
            });
            api.sendNativeNotification(notificationTitle, notificationBody);

            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current !== null) {
        window.clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }

    return () => {
      if (timerRef.current !== null) {
        window.clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [isRunning, isPaused, noteTitle, t]);

  const mins = Math.floor(remainingSeconds / 60);
  const secs = remainingSeconds % 60;
  const formattedTime = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

  const totalSeconds = durationMinutes * 60;
  const progressPercent =
    totalSeconds > 0 ? Math.round(((totalSeconds - remainingSeconds) / totalSeconds) * 100) : 0;

  return {
    noteId,
    noteTitle,
    durationMinutes,
    remainingSeconds,
    isRunning,
    isPaused,
    formattedTime,
    progressPercent,
    startSprint,
    pauseSprint,
    resumeSprint,
    stopSprint,
    resetSprint,
  };
}
