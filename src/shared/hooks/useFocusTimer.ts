import { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { api } from '../api/ipc';
import { playTimerCompleteSound } from '../utils/soundEffects';

export interface FocusTimerState {
  noteId: string | null;
  noteTitle: string | null;
  totalPlannedSeconds: number;
  remainingSeconds: number;
  isRunning: boolean;
  isPaused: boolean;
  formattedTime: string;
  progressPercent: number;
  startSprint: (noteId: string, noteTitle: string, totalSeconds: number) => void;
  pauseSprint: () => void;
  resumeSprint: () => void;
  stopSprint: () => void;
  resetSprint: () => void;
}

interface FocusTimerOptions {
  onSprintCompleted?: (noteId: string, secondsSpent: number) => void;
}

export function useFocusTimer(options?: FocusTimerOptions): FocusTimerState {
  const { t } = useTranslation();
  const [noteId, setNoteId] = useState<string | null>(null);
  const [noteTitle, setNoteTitle] = useState<string | null>(null);
  const [totalPlannedSeconds, setTotalPlannedSeconds] = useState<number>(25 * 60);
  const [remainingSeconds, setRemainingSeconds] = useState<number>(25 * 60);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);

  const timerRef = useRef<number | null>(null);
  const hasFinishedRef = useRef(false);
  const onSprintCompletedRef = useRef(options?.onSprintCompleted);
  onSprintCompletedRef.current = options?.onSprintCompleted;

  const startSprint = useCallback((id: string, title: string, totalSeconds: number) => {
    const validSecs = Math.max(5, Math.round(totalSeconds));
    hasFinishedRef.current = false;
    setNoteId(id);
    setNoteTitle(title);
    setTotalPlannedSeconds(validSecs);
    setRemainingSeconds(validSecs);
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
    if (noteId && isRunning) {
      const elapsed = totalPlannedSeconds - remainingSeconds;
      if (elapsed >= 10) {
        onSprintCompletedRef.current?.(noteId, elapsed);
      }
    }
    hasFinishedRef.current = true;
    setIsRunning(false);
    setIsPaused(false);
    setRemainingSeconds(totalPlannedSeconds);
  }, [noteId, isRunning, totalPlannedSeconds, remainingSeconds]);

  const resetSprint = useCallback(() => {
    hasFinishedRef.current = true;
    setIsRunning(false);
    setIsPaused(false);
    setNoteId(null);
    setNoteTitle(null);
    setRemainingSeconds(25 * 60);
    setTotalPlannedSeconds(25 * 60);
  }, []);

  // Tick interval (pure state countdown)
  useEffect(() => {
    if (isRunning && !isPaused) {
      timerRef.current = window.setInterval(() => {
        setRemainingSeconds((prev) => (prev > 0 ? prev - 1 : 0));
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
  }, [isRunning, isPaused]);

  // Handle sprint completion side-effects exactly once
  useEffect(() => {
    if (isRunning && remainingSeconds === 0 && !hasFinishedRef.current) {
      hasFinishedRef.current = true;
      if (timerRef.current !== null) {
        window.clearInterval(timerRef.current);
        timerRef.current = null;
      }
      setIsRunning(false);
      setIsPaused(false);

      // Record completed focus time
      if (noteId) {
        onSprintCompletedRef.current?.(noteId, totalPlannedSeconds);
      }

      // Audio & Native Notification
      playTimerCompleteSound();
      const notificationTitle = t('focusTimer.finishedTitle');
      const notificationBody = t('focusTimer.finishedBody', {
        noteTitle: noteTitle || t('note.untitled'),
      });
      api.sendNativeNotification(notificationTitle, notificationBody);
    }
  }, [isRunning, remainingSeconds, noteId, noteTitle, totalPlannedSeconds, t]);

  const mins = Math.floor(remainingSeconds / 60);
  const secs = remainingSeconds % 60;
  const formattedTime = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

  const progressPercent =
    totalPlannedSeconds > 0
      ? Math.round(((totalPlannedSeconds - remainingSeconds) / totalPlannedSeconds) * 100)
      : 0;

  return {
    noteId,
    noteTitle,
    totalPlannedSeconds,
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
