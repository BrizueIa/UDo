// Web Audio API high-fidelity acoustic feedback utility for UDo (FR-15)
let audioCtx: AudioContext | null = null;
const STORAGE_MUTE_KEY = 'udo_sound_muted';
const STORAGE_VOLUME_KEY = 'udo_sound_volume';

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const AudioCtxClass =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  if (!AudioCtxClass) return null;
  if (!audioCtx) {
    audioCtx = new AudioCtxClass();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

export function isAudioMuted(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(STORAGE_MUTE_KEY) === 'true';
}

export function setAudioMuted(muted: boolean): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_MUTE_KEY, muted ? 'true' : 'false');
}

export function toggleAudioMute(): boolean {
  const next = !isAudioMuted();
  setAudioMuted(next);
  return next;
}

export function getAudioVolume(): number {
  if (typeof window === 'undefined') return 0.6;
  const saved = localStorage.getItem(STORAGE_VOLUME_KEY);
  if (saved !== null) {
    const parsed = parseFloat(saved);
    if (!isNaN(parsed) && parsed >= 0 && parsed <= 1) return parsed;
  }
  return 0.6;
}

export function setAudioVolume(vol: number): void {
  if (typeof window === 'undefined') return;
  const clamped = Math.max(0, Math.min(1, vol));
  localStorage.setItem(STORAGE_VOLUME_KEY, clamped.toString());
}

/**
 * Emits a satisfying, tactile acoustic pop / wooden click upon task/checkbox completion
 */
export function playTaskCompleteSound(): void {
  if (isAudioMuted()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const volume = getAudioVolume();
    if (volume <= 0) return;

    const now = ctx.currentTime;

    // 1. High transient click (simulates physical finger/tool impact)
    const clickOsc = ctx.createOscillator();
    const clickGain = ctx.createGain();
    clickOsc.type = 'sine';
    clickOsc.frequency.setValueAtTime(1100, now);
    clickOsc.frequency.exponentialRampToValueAtTime(350, now + 0.015);

    clickGain.gain.setValueAtTime(0.28 * volume, now);
    clickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.015);
    clickOsc.connect(clickGain);
    clickGain.connect(ctx.destination);
    clickOsc.start(now);
    clickOsc.stop(now + 0.015);

    // 2. Warm resonant wooden body (sine harmonic body tone)
    const bodyOsc = ctx.createOscillator();
    const bodyGain = ctx.createGain();
    bodyOsc.type = 'triangle';
    bodyOsc.frequency.setValueAtTime(440, now);
    bodyOsc.frequency.exponentialRampToValueAtTime(260, now + 0.06);

    bodyGain.gain.setValueAtTime(0.35 * volume, now);
    bodyGain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
    bodyOsc.connect(bodyGain);
    bodyGain.connect(ctx.destination);
    bodyOsc.start(now);
    bodyOsc.stop(now + 0.06);
  } catch {
    // Audio context may be restricted
  }
}

/**
 * Emits an airy, soft ascending chime upon note creation
 */
export function playNoteCreatedSound(): void {
  if (isAudioMuted()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const volume = getAudioVolume();
    if (volume <= 0) return;

    const pitches = [523.25, 783.99]; // C5 -> G5
    pitches.forEach((freq, idx) => {
      const now = ctx.currentTime + idx * 0.05;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);
      gain.gain.setValueAtTime(0.22 * volume, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.15);
    });
  } catch {
    // Audio context may be restricted
  }
}

/**
 * Emits a gentle harmonic marimba sequence when a focus timer sprint completes
 */
export function playTimerCompleteSound(): void {
  if (isAudioMuted()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const volume = getAudioVolume();
    if (volume <= 0) return;

    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
    notes.forEach((freq, idx) => {
      const startTime = ctx.currentTime + idx * 0.12;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, startTime);

      gain.gain.setValueAtTime(0.25 * volume, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.45);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + 0.45);
    });
  } catch {
    // Audio context may be restricted
  }
}
