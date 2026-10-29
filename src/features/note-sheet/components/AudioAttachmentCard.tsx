import React, { useState, useRef, useEffect } from 'react';
import { NoteAttachment } from '../../../shared/types';
import { attachmentsApi } from '../../../shared/api/attachmentsApi';
import { Play, Pause, X, ExternalLink, Trash2, Pencil, Check, Mic } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useContextMenu } from '../../../shared/ui/context-menu';

interface Props {
  attachment: NoteAttachment;
  onRemove: (id: string) => void;
  onRename?: (id: string, newName: string) => void;
}

export const AudioAttachmentCard: React.FC<Props> = ({ attachment, onRemove, onRename }) => {
  const { t } = useTranslation();
  const { openContextMenu } = useContextMenu();
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState(attachment.name || '');
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    setEditedName(attachment.name || '');
  }, [attachment.name]);

  useEffect(() => {
    if (isEditingName) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [isEditingName]);

  const handleSaveName = () => {
    setIsEditingName(false);
    const clean = editedName.trim();
    if (clean && clean !== attachment.name) {
      onRename?.(attachment.id, clean);
    } else {
      setEditedName(attachment.name || '');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSaveName();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setIsEditingName(false);
      setEditedName(attachment.name || '');
    }
  };
  const [duration, setDuration] = useState<number>(() => {
    if (attachment.durationSeconds && attachment.durationSeconds > 0 && attachment.durationSeconds < 7200) {
      return attachment.durationSeconds;
    }
    return 0;
  });
  const [playbackRate, setPlaybackRate] = useState<number>(1);
  const [audioSrc, setAudioSrc] = useState<string>('');

  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    let isMounted = true;
    if (attachment.filePath) {
      if (attachment.filePath.startsWith('blob:') || attachment.filePath.startsWith('data:')) {
        setAudioSrc(attachment.filePath);
      } else {
        attachmentsApi.readAttachmentBase64(attachment.filePath).then((src) => {
          if (isMounted && src) setAudioSrc(src);
        }).catch(() => {});
      }
    }
    return () => { isMounted = false; };
  }, [attachment.filePath]);

  useEffect(() => {
    const selectedOutputId = localStorage.getItem('udo:audio-output-device-id');
    if (audioRef.current && selectedOutputId && 'setSinkId' in HTMLMediaElement.prototype) {
      (audioRef.current as unknown as { setSinkId: (id: string) => Promise<void> })
        .setSinkId(selectedOutputId)
        .catch(() => {});
    }
  }, [audioSrc]);

  const formatTime = (secs: number) => {
    if (isNaN(secs) || !isFinite(secs) || secs < 0 || secs > 7200) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const nextTime = Number(e.target.value);
    setCurrentTime(nextTime);
    if (audioRef.current) audioRef.current.currentTime = nextTime;
  };

  const cyclePlaybackRate = () => {
    const nextRate = playbackRate === 1 ? 1.5 : playbackRate === 1.5 ? 2 : 1;
    setPlaybackRate(nextRate);
    if (audioRef.current) audioRef.current.playbackRate = nextRate;
  };

  const handleOpenExternal = async () => {
    try {
      await attachmentsApi.openAttachmentNative(attachment.filePath);
    } catch (err) {
      console.error('Failed to open external audio:', err);
    }
  };

  const handleDelete = async () => {
    if (audioRef.current) audioRef.current.pause();
    try {
      await attachmentsApi.deleteAttachmentFile(attachment.filePath);
    } catch (err) {
      console.error('Failed to delete audio file:', err);
    }
    onRemove(attachment.id);
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    openContextMenu(e, [
      {
        id: 'rename-audio',
        label: t('voiceRecorder.renameRecording') || 'Renombrar grabación',
        icon: <Pencil size={14} />,
        onClick: () => setIsEditingName(true),
      },
      {
        id: 'open-native',
        label: t('attachments.openWithSystemApp') || 'Abrir con aplicación del sistema',
        icon: <ExternalLink size={14} />,
        onClick: handleOpenExternal,
      },
      { id: 'sep-1', label: '', separator: true },
      {
        id: 'delete-audio',
        label: t('voiceRecorder.deleteRecording') || 'Eliminar grabación',
        icon: <Trash2 size={14} />,
        danger: true,
        onClick: handleDelete,
      },
    ]);
  };

  return (
    <div
      onContextMenu={handleContextMenu}
      className="group relative flex flex-col space-y-1.5 px-3 py-2 rounded-xl bg-theme-card/60 hover:bg-theme-card border border-white/[0.06] hover:border-white/[0.14] transition-all shadow-xs hover:shadow-md w-72 select-none"
    >
      {/* Top: Editable Title Header */}
      <div className="flex items-center justify-between text-xs min-w-0 gap-1.5">
        <div className="flex items-center space-x-1.5 min-w-0 flex-1">
          <Mic size={12} className="text-rose-400 shrink-0" />
          {isEditingName ? (
            <input
              ref={inputRef}
              type="text"
              value={editedName}
              onChange={(e) => setEditedName(e.target.value)}
              onBlur={handleSaveName}
              onKeyDown={handleKeyDown}
              placeholder={t('voiceRecorder.audioNamePlaceholder') || 'Nombre del audio...'}
              className="bg-theme-column px-1.5 py-0.5 rounded text-xs text-theme-text border border-theme-accent outline-none w-full font-medium"
            />
          ) : (
            <span
              onDoubleClick={() => setIsEditingName(true)}
              className="font-medium text-theme-text truncate hover:text-theme-accent cursor-pointer text-[12px]"
              title={t('common.doubleClickToRename') || 'Doble clic para renombrar'}
            >
              {attachment.name || t('voiceRecorder.defaultAudioName') || 'Nota de voz'}
            </span>
          )}
        </div>

        <div className="flex items-center space-x-1 shrink-0">
          {!isEditingName ? (
            <button
              type="button"
              onClick={() => setIsEditingName(true)}
              className="text-theme-muted hover:text-theme-text p-0.5 rounded opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
              title={t('voiceRecorder.renameRecording') || 'Renombrar grabación'}
            >
              <Pencil size={11} />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSaveName}
              className="text-emerald-400 p-0.5 rounded hover:bg-emerald-500/20 cursor-pointer"
            >
              <Check size={11} />
            </button>
          )}

          {/* Delete Button */}
          <button
            type="button"
            onClick={handleDelete}
            className="text-theme-muted hover:text-rose-400 p-0.5 rounded opacity-0 group-hover:opacity-100 transition-all shrink-0 cursor-pointer"
            title={t('voiceRecorder.deleteRecording')}
          >
            <X size={12} />
          </button>
        </div>
      </div>

      {audioSrc && (
        <audio
          ref={audioRef}
          src={audioSrc}
          onTimeUpdate={() => {
            if (audioRef.current) {
              const cur = audioRef.current.currentTime;
              setCurrentTime(cur);
              if (duration > 7200) {
                setDuration(Math.max(1, Math.round(cur)));
              }
            }
          }}
          onLoadedMetadata={() => {
            if (audioRef.current) {
              const d = audioRef.current.duration;
              if (attachment.durationSeconds && attachment.durationSeconds > 0 && attachment.durationSeconds < 7200) {
                setDuration(attachment.durationSeconds);
                return;
              }
              if (isFinite(d) && d > 0 && d < 7200) {
                setDuration(Math.round(d));
              }
            }
          }}
          onEnded={() => {
            setIsPlaying(false);
            setCurrentTime(0);
            if (audioRef.current && (duration === 0 || duration > 7200)) {
              const end = Math.max(1, Math.round(audioRef.current.currentTime));
              if (end > 0 && end < 7200) setDuration(end);
            }
          }}
        />
      )}

      {/* Controls Row */}
      <div className="flex items-center space-x-2 pt-0.5">
        {/* Play/Pause Button */}
        <button
          type="button"
          onClick={togglePlay}
          className="w-7 h-7 rounded-full bg-theme-accent/20 hover:bg-theme-accent/30 text-theme-accent flex items-center justify-center shrink-0 transition-colors cursor-pointer"
          title={isPlaying ? t('audioPlayer.pause') : t('audioPlayer.play')}
        >
          {isPlaying ? <Pause size={13} className="fill-current" /> : <Play size={13} className="fill-current ml-0.5" />}
        </button>

        {/* Progress and Time */}
        <div className="flex-1 min-w-0 flex flex-col justify-center space-y-0.5">
          <div className="flex items-center justify-between text-[10px] font-mono text-theme-muted">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
          <input
            type="range"
            min={0}
            max={duration > 0 && duration < 7200 ? duration : Math.max(1, currentTime)}
            step={0.1}
            value={Math.min(currentTime, duration > 0 ? duration : currentTime)}
            onChange={handleSeek}
            className="w-full audio-seek-slider"
          />
        </div>

        {/* Speed Rate Pill */}
        <button
          type="button"
          onClick={cyclePlaybackRate}
          className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-theme-base/60 text-theme-muted hover:text-theme-text border border-white/[0.04] transition-colors shrink-0 cursor-pointer"
          title={t('audioPlayer.speed')}
        >
          {playbackRate}x
        </button>

        {/* Open in OS App */}
        <button
          type="button"
          onClick={handleOpenExternal}
          className="text-theme-muted hover:text-theme-text p-1 rounded opacity-0 group-hover:opacity-100 transition-all shrink-0 cursor-pointer"
          title={t('attachments.openWithSystemApp')}
        >
          <ExternalLink size={12} />
        </button>
      </div>
    </div>
  );
};
