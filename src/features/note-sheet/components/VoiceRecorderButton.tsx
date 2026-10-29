import React, { useState, useRef, useEffect } from 'react';
import { Mic, Square, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { NoteAttachment } from '../../../shared/types';
import { attachmentsApi } from '../../../shared/api/attachmentsApi';

interface Props {
  onAttachmentCreated: (attachment: NoteAttachment) => void;
  onError?: (message: string) => void;
}

export const VoiceRecorderButton: React.FC<Props> = ({ onAttachmentCreated, onError }) => {
  const { t } = useTranslation();
  const [isRecording, setIsRecording] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const isCancelledRef = useRef<boolean>(false);
  const isNativeRecordingRef = useRef<boolean>(false);
  const startTimeRef = useRef<number>(0);

  useEffect(() => {
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      if (streamRef.current) streamRef.current.getTracks().forEach((track) => track.stop());
    };
  }, []);

  const formatTimer = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const startRecording = async () => {
    const selectedInputId = localStorage.getItem('udo:audio-input-device-id') || '';
    isCancelledRef.current = false;
    isNativeRecordingRef.current = false;

    // 1. Try Browser / WebKit getUserMedia
    try {
      const constraints: MediaStreamConstraints = {
        audio: selectedInputId ? { deviceId: { exact: selectedInputId } } : true,
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : 'audio/webm';

      const recorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = async () => {
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((track) => track.stop());
          streamRef.current = null;
        }

        if (isCancelledRef.current) {
          audioChunksRef.current = [];
          return;
        }

        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        if (audioBlob.size === 0) return;

        const arrayBuffer = await audioBlob.arrayBuffer();
        const uint8Array = new Uint8Array(arrayBuffer);
        const fileName = `voice-${Date.now()}.webm`;

        const savedPath = await attachmentsApi.saveAttachmentFile(fileName, uint8Array);

        // Compute exact duration from start timestamp to avoid WebKitGTK WebM metadata duration bug
        const measuredDuration = startTimeRef.current
          ? Math.max(1, Math.round((Date.now() - startTimeRef.current) / 1000))
          : 1;

        onAttachmentCreated({
          id: `audio-${Date.now()}`,
          name: fileName,
          filePath: savedPath,
          mimeType: 'audio/webm',
          sizeBytes: audioBlob.size,
          extension: 'webm',
          kind: 'audio',
          durationSeconds: measuredDuration,
          createdAt: new Date().toISOString(),
        });
        audioChunksRef.current = [];
      };

      recorder.start(250);
      startTimeRef.current = Date.now();
      setIsRecording(true);
      setElapsedSeconds(0);
      timerIntervalRef.current = setInterval(() => {
        const diff = Math.round((Date.now() - startTimeRef.current) / 1000);
        setElapsedSeconds(diff);
      }, 500);
      return;
    } catch (webErr) {
      console.warn('Web getUserMedia failed, attempting native recording fallback...', webErr);
    }

    // 2. Native OS Fallback via pw-record / arecord (Linux)
    const nativeStarted = await attachmentsApi.startNativeRecording(selectedInputId);
    if (nativeStarted) {
      isNativeRecordingRef.current = true;
      startTimeRef.current = Date.now();
      setIsRecording(true);
      setElapsedSeconds(0);
      timerIntervalRef.current = setInterval(() => {
        const diff = Math.round((Date.now() - startTimeRef.current) / 1000);
        setElapsedSeconds(diff);
      }, 500);
      return;
    }

    onError?.(t('voiceRecorder.microphonePermissionError'));
  };

  const stopAndSave = async () => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    isCancelledRef.current = false;
    setIsRecording(false);

    const measuredDuration = startTimeRef.current
      ? Math.max(1, Math.round((Date.now() - startTimeRef.current) / 1000))
      : 1;

    if (isNativeRecordingRef.current) {
      const savedPath = await attachmentsApi.stopNativeRecording();
      if (savedPath) {
        onAttachmentCreated({
          id: `audio-${Date.now()}`,
          name: `voice-${Date.now()}.wav`,
          filePath: savedPath,
          mimeType: 'audio/wav',
          sizeBytes: 0,
          extension: 'wav',
          kind: 'audio',
          durationSeconds: measuredDuration,
          createdAt: new Date().toISOString(),
        });
      }
      isNativeRecordingRef.current = false;
      return;
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
  };

  const cancelRecording = async () => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    isCancelledRef.current = true;
    setIsRecording(false);
    setElapsedSeconds(0);

    if (isNativeRecordingRef.current) {
      await attachmentsApi.cancelNativeRecording();
      isNativeRecordingRef.current = false;
      return;
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
  };

  if (isRecording) {
    return (
      <div className="flex items-center space-x-1.5 px-2 py-0.5 rounded-lg bg-red-500/10 border border-red-500/30 text-xs">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
        </span>
        <span className="font-mono text-red-400 font-semibold text-[11px]">
          {formatTimer(elapsedSeconds)}
        </span>
        <button
          type="button"
          onClick={stopAndSave}
          className="p-1 rounded hover:bg-red-500/20 text-emerald-400 transition-colors cursor-pointer"
          title={t('voiceRecorder.saveRecording')}
        >
          <Square size={11} className="fill-current" />
        </button>
        <button
          type="button"
          onClick={cancelRecording}
          className="p-1 rounded hover:bg-red-500/20 text-theme-muted hover:text-red-400 transition-colors cursor-pointer"
          title={t('voiceRecorder.cancelRecording')}
        >
          <Trash2 size={11} />
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={startRecording}
      className="flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-theme-card hover:bg-theme-hover text-theme-muted hover:text-theme-text border border-white/[0.05] transition-colors text-[11px] cursor-pointer"
      title={t('voiceRecorder.recordVoiceNote')}
    >
      <Mic size={12} className="text-red-400" />
      <span>{t('voiceRecorder.record')}</span>
    </button>
  );
};
