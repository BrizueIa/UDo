import { useState, useEffect, useCallback, useRef } from 'react';
import { attachmentsApi, AudioDeviceOption } from '../api/attachmentsApi';

export function useAudioDevices() {
  const [inputDevices, setInputDevices] = useState<AudioDeviceOption[]>([]);
  const [outputDevices, setOutputDevices] = useState<AudioDeviceOption[]>([]);
  const [selectedInputId, setSelectedInputId] = useState<string>(
    () => localStorage.getItem('udo:audio-input-device-id') || ''
  );
  const [selectedOutputId, setSelectedOutputId] = useState<string>(
    () => localStorage.getItem('udo:audio-output-device-id') || ''
  );
  const [micLevel, setMicLevel] = useState<number>(0);
  const [isTestingMic, setIsTestingMic] = useState<boolean>(false);
  const micStreamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number | null>(null);

  const refreshDevices = useCallback(async () => {
    try {
      const inputs: AudioDeviceOption[] = [];
      const outputs: AudioDeviceOption[] = [];

      // 1. Browser mediaDevices
      if (typeof navigator !== 'undefined' && navigator.mediaDevices?.enumerateDevices) {
        const devices = await navigator.mediaDevices.enumerateDevices();
        devices.forEach((d) => {
          if (d.kind === 'audioinput') {
            inputs.push({ id: d.deviceId, name: d.label || `Mic (${d.deviceId.slice(0, 5)})` });
          } else if (d.kind === 'audiooutput') {
            outputs.push({ id: d.deviceId, name: d.label || `Speaker (${d.deviceId.slice(0, 5)})` });
          }
        });
      }

      // 2. Tauri system level devices (Linux pactl / pipewire)
      const system = await attachmentsApi.getSystemAudioDevices();
      if (system.inputs.length > 0 && inputs.length === 0) {
        system.inputs.forEach((i) => inputs.push(i));
      }
      if (system.outputs.length > 0 && outputs.length === 0) {
        system.outputs.forEach((o) => outputs.push(o));
      }

      setInputDevices(inputs);
      setOutputDevices(outputs);
    } catch (err) {
      console.warn('Error enumerating audio devices:', err);
    }
  }, []);

  useEffect(() => {
    refreshDevices();
    if (typeof navigator !== 'undefined' && navigator.mediaDevices) {
      navigator.mediaDevices.ondevicechange = refreshDevices;
    }
    return () => {
      if (typeof navigator !== 'undefined' && navigator.mediaDevices) {
        navigator.mediaDevices.ondevicechange = null;
      }
    };
  }, [refreshDevices]);

  const changeInputDevice = useCallback((id: string) => {
    setSelectedInputId(id);
    localStorage.setItem('udo:audio-input-device-id', id);
  }, []);

  const changeOutputDevice = useCallback((id: string) => {
    setSelectedOutputId(id);
    localStorage.setItem('udo:audio-output-device-id', id);
  }, []);

  const playTestSound = useCallback(() => {
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15); // A5
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.45);
    } catch (e) {
      console.warn('Could not play test sound:', e);
    }
  }, []);

  const stopMicTest = useCallback(() => {
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach((t) => t.stop());
      micStreamRef.current = null;
    }
    setMicLevel(0);
    setIsTestingMic(false);
  }, []);

  const startMicTest = useCallback(async () => {
    stopMicTest();
    try {
      const constraints: MediaStreamConstraints = {
        audio: selectedInputId ? { deviceId: { exact: selectedInputId } } : true,
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      micStreamRef.current = stream;
      setIsTestingMic(true);

      // Refresh devices now that permission is granted so labels populate
      refreshDevices();

      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AudioCtx();
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);

      const buffer = new Uint8Array(analyser.frequencyBinCount);
      const tick = () => {
        analyser.getByteFrequencyData(buffer);
        let sum = 0;
        for (let i = 0; i < buffer.length; i++) sum += buffer[i];
        const avg = sum / buffer.length;
        setMicLevel(Math.min(100, Math.round((avg / 128) * 100)));
        animFrameRef.current = requestAnimationFrame(tick);
      };
      tick();

      setTimeout(() => stopMicTest(), 4000);
    } catch (err) {
      console.warn('Mic test failed:', err);
      stopMicTest();
      throw err;
    }
  }, [selectedInputId, stopMicTest, refreshDevices]);

  return {
    inputDevices,
    outputDevices,
    selectedInputId,
    selectedOutputId,
    changeInputDevice,
    changeOutputDevice,
    refreshDevices,
    playTestSound,
    startMicTest,
    stopMicTest,
    isTestingMic,
    micLevel,
  };
}
