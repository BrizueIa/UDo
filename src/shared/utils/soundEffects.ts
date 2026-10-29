// Web Audio API high-fidelity acoustic feedback utility for UDo (FR-15)
let audioCtx: AudioContext | null = null;
const STORAGE_MUTE_KEY = 'udo_sound_muted';
const STORAGE_VOLUME_KEY = 'udo_sound_volume';
const STORAGE_KEYBOARD_SOUND_KEY = 'udo_sound_keyboard';
const STORAGE_CLICK_SOUND_KEY = 'udo_sound_click';
const STORAGE_COMPLETION_SOUND_KEY = 'udo_sound_completion';
const STORAGE_TIMER_SOUND_KEY = 'udo_sound_timer';

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

// Proactive user interaction listener to unlock AudioContext on first user action
if (typeof window !== 'undefined') {
  const unlockAudio = () => {
    const ctx = getAudioContext();
    if (ctx && ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }
  };
  window.addEventListener('pointerdown', unlockAudio, { passive: true, capture: true });
  window.addEventListener('keydown', unlockAudio, { passive: true, capture: true });
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
  if (typeof window === 'undefined') return 0.7;
  const saved = localStorage.getItem(STORAGE_VOLUME_KEY);
  if (saved !== null) {
    const parsed = parseFloat(saved);
    if (!isNaN(parsed) && parsed >= 0 && parsed <= 1) return parsed;
  }
  return 0.7;
}

export function setAudioVolume(vol: number): void {
  if (typeof window === 'undefined') return;
  const clamped = Math.max(0, Math.min(1, vol));
  localStorage.setItem(STORAGE_VOLUME_KEY, clamped.toString());
}

export const isKeyboardSoundEnabled = (): boolean =>
  typeof window !== 'undefined' && localStorage.getItem(STORAGE_KEYBOARD_SOUND_KEY) !== 'false';

export const setKeyboardSoundEnabled = (enabled: boolean): void => {
  if (typeof window !== 'undefined') localStorage.setItem(STORAGE_KEYBOARD_SOUND_KEY, String(enabled));
};

export const isClickSoundEnabled = (): boolean =>
  typeof window !== 'undefined' && localStorage.getItem(STORAGE_CLICK_SOUND_KEY) !== 'false';

export const setClickSoundEnabled = (enabled: boolean): void => {
  if (typeof window !== 'undefined') localStorage.setItem(STORAGE_CLICK_SOUND_KEY, String(enabled));
};

export const isCompletionSoundEnabled = (): boolean =>
  typeof window !== 'undefined' && localStorage.getItem(STORAGE_COMPLETION_SOUND_KEY) !== 'false';

export const setCompletionSoundEnabled = (enabled: boolean): void => {
  if (typeof window !== 'undefined') localStorage.setItem(STORAGE_COMPLETION_SOUND_KEY, String(enabled));
};

export const isTimerSoundEnabled = (): boolean =>
  typeof window !== 'undefined' && localStorage.getItem(STORAGE_TIMER_SOUND_KEY) !== 'false';

export const setTimerSoundEnabled = (enabled: boolean): void => {
  if (typeof window !== 'undefined') localStorage.setItem(STORAGE_TIMER_SOUND_KEY, String(enabled));
};

/**
 * Emits a crisp, tactile mechanical switch "tic" (Opera GX / mechanical switch style)
 */
export function playKeyboardClickSound(
  keyOrForce?: string | boolean,
  force = false
): void {
  const isForced = typeof keyOrForce === 'boolean' ? keyOrForce : force;
  if (!isForced && (isAudioMuted() || !isKeyboardSoundEnabled())) return;
  const ctx = getAudioContext();
  if (!ctx) return;
  if (ctx.state === 'suspended') {
    ctx.resume().catch(() => {});
  }

  try {
    const volume = getAudioVolume();
    if (volume <= 0) return;
    const now = ctx.currentTime;

    const key = typeof keyOrForce === 'string' ? keyOrForce : '';
    const isSpace = key === ' ';
    const isEnter = key === 'Enter';
    const isBackspace = key === 'Backspace' || key === 'Delete';

    // Organic tactile pitch variation (±4%)
    const jitter = 0.96 + Math.random() * 0.08;
    const duration = isSpace ? 0.038 : 0.028;
    const keyGain = isSpace ? 0.26 : isEnter ? 0.24 : isBackspace ? 0.20 : 0.22;

    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(keyGain * volume, now);
    masterGain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    masterGain.connect(ctx.destination);

    // Layer 1: Crisp "tic" tactile switch snap (high-frequency transient)
    const ticOsc = ctx.createOscillator();
    const ticGain = ctx.createGain();
    ticOsc.type = 'triangle';
    const ticStart = (isSpace ? 1400 : 1850) * jitter;
    const ticEnd = (isSpace ? 650 : 850) * jitter;
    ticOsc.frequency.setValueAtTime(ticStart, now);
    ticOsc.frequency.exponentialRampToValueAtTime(ticEnd, now + 0.012);
    ticGain.gain.setValueAtTime(0.55, now);
    ticGain.gain.exponentialRampToValueAtTime(0.001, now + 0.012);
    ticOsc.connect(ticGain);
    ticGain.connect(masterGain);
    ticOsc.start(now);
    ticOsc.stop(now + 0.012);

    // Layer 2: Tactile switch bottom-out body
    const bodyOsc = ctx.createOscillator();
    const bodyGain = ctx.createGain();
    bodyOsc.type = 'sine';
    const bodyStart = (isSpace ? 480 : 720) * jitter;
    const bodyEnd = (isSpace ? 200 : 300) * jitter;
    bodyOsc.frequency.setValueAtTime(bodyStart, now);
    bodyOsc.frequency.exponentialRampToValueAtTime(bodyEnd, now + duration);
    bodyGain.gain.setValueAtTime(0.45, now);
    bodyGain.gain.exponentialRampToValueAtTime(0.001, now + duration);
    bodyOsc.connect(bodyGain);
    bodyGain.connect(masterGain);
    bodyOsc.start(now);
    bodyOsc.stop(now + duration);
  } catch {
    // Audio context may be restricted
  }
}

/**
 * Emits a crisp tactile UI click sound (Opera GX style button click)
 */
export function playUiClickSound(force = false): void {
  if (!force && (isAudioMuted() || !isClickSoundEnabled())) return;
  const ctx = getAudioContext();
  if (!ctx) return;
  if (ctx.state === 'suspended') {
    ctx.resume().catch(() => {});
  }

  try {
    const volume = getAudioVolume();
    if (volume <= 0) return;
    const now = ctx.currentTime;
    const duration = 0.032;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    // Subtle organic variation (460-510Hz)
    const pitch = 460 + Math.random() * 50;
    osc.frequency.setValueAtTime(pitch, now);
    osc.frequency.exponentialRampToValueAtTime(160, now + duration);

    gain.gain.setValueAtTime(0.24 * volume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + duration);
  } catch {
    // Audio context may be restricted
  }
}

/**
 * Emits a crisp, noticeable and rewarding chime + pop upon completing a task or checkbox
 */
export function playTaskCompleteSound(force = false): void {
  if (!force && (isAudioMuted() || !isCompletionSoundEnabled())) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const volume = getAudioVolume();
    if (volume <= 0) return;

    const now = ctx.currentTime;

    // 1. Initial mechanical transient tap (wood/felt impact)
    const popOsc = ctx.createOscillator();
    const popGain = ctx.createGain();
    popOsc.type = 'triangle';
    popOsc.frequency.setValueAtTime(800, now);
    popOsc.frequency.exponentialRampToValueAtTime(180, now + 0.035);

    popGain.gain.setValueAtTime(0.4 * volume, now);
    popGain.gain.exponentialRampToValueAtTime(0.001, now + 0.035);
    popOsc.connect(popGain);
    popGain.connect(ctx.destination);
    popOsc.start(now);
    popOsc.stop(now + 0.035);

    // 2. Bright, rewarding two-tone ascending chime (E5 -> B5)
    const tones = [
      { freq: 659.25, timeOffset: 0.015, duration: 0.18, gain: 0.38 },
      { freq: 987.77, timeOffset: 0.065, duration: 0.26, gain: 0.45 },
    ];

    tones.forEach((tone) => {
      const start = now + tone.timeOffset;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(tone.freq, start);

      gain.gain.setValueAtTime(tone.gain * volume, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + tone.duration);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(start);
      osc.stop(start + tone.duration);
    });
  } catch {
    // Audio context may be restricted
  }
}

/**
 * Emits a distinct, bright 3-note ascending synth arpeggio upon note creation
 */
export function playNoteCreatedSound(): void {
  if (isAudioMuted()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const volume = getAudioVolume();
    if (volume <= 0) return;

    // D5 -> G5 -> B5 (G major ascending triad)
    const pitches = [587.33, 783.99, 987.77];
    pitches.forEach((freq, idx) => {
      const start = ctx.currentTime + idx * 0.045;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, start);

      gain.gain.setValueAtTime(0.35 * volume, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.22);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(start);
      osc.stop(start + 0.22);
    });
  } catch {
    // Audio context may be restricted
  }
}

/**
 * Emits a gentle harmonic marimba sequence when a focus timer sprint completes
 */
export function playTimerCompleteSound(force = false): void {
  if (!force && (isAudioMuted() || !isTimerSoundEnabled())) return;
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

      gain.gain.setValueAtTime(0.35 * volume, startTime);
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

const MODIFIERS_ONLY = new Set(['Control', 'Alt', 'Shift', 'Meta', 'CapsLock']);

/**
 * Attaches global window listeners for tactile UI clicks and mechanical keyboard sounds (Opera GX style)
 */
export function attachGlobalSoundListeners(): () => void {
  if (typeof window === 'undefined') return () => {};

  const handlePointerDown = (e: PointerEvent) => {
    // Primary (left click) or secondary (right click) triggers instant tactile sound on every click
    if (e.button === 0 || e.button === 2) {
      playUiClickSound();
    }
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    // Only ignore standalone modifier keydown so holding Shift/Ctrl alone doesn't trigger premature clicks
    if (MODIFIERS_ONLY.has(e.key)) return;
    playKeyboardClickSound(e.key);
  };

  window.addEventListener('pointerdown', handlePointerDown, true);
  window.addEventListener('keydown', handleKeyDown, true);

  return () => {
    window.removeEventListener('pointerdown', handlePointerDown, true);
    window.removeEventListener('keydown', handleKeyDown, true);
  };
}
