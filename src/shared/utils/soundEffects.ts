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
 * Emits a subtle, soft and satisfying creamy mechanical switch tap (Opera GX style typing sound)
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
    let startFreq = 330 + Math.random() * 50; // default 330-380Hz
    let endFreq = 160;
    let duration = 0.034;
    let keyGain = 0.19;

    if (key === ' ') {
      // Spacebar: deeper, rounder thock
      startFreq = 220 + Math.random() * 25;
      endFreq = 110;
      duration = 0.042;
      keyGain = 0.22;
    } else if (key === 'Enter') {
      // Enter: affirmative, slightly lower tone
      startFreq = 270 + Math.random() * 30;
      endFreq = 130;
      duration = 0.038;
      keyGain = 0.21;
    } else if (key === 'Backspace' || key === 'Delete') {
      // Backspace: soft muted tap
      startFreq = 250 + Math.random() * 25;
      endFreq = 120;
      duration = 0.032;
      keyGain = 0.18;
    }

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(startFreq, now);
    osc.frequency.exponentialRampToValueAtTime(endFreq, now + duration);

    // Warm, creamy lowpass filter cutting out harsh highs (Opera GX style)
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(950, now);
    filter.Q.setValueAtTime(1.0, now);

    gain.gain.setValueAtTime(keyGain * volume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + duration);
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

const IGNORED_KEYS = new Set([
  'Shift', 'Control', 'Alt', 'Meta', 'Escape', 'Tab', 'CapsLock',
  'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight',
  'PageUp', 'PageDown', 'Home', 'End', 'Insert', 'NumLock', 'ScrollLock', 'Pause',
]);

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
    const target = e.target as HTMLElement | null;
    if (!target) return;
    const isInput =
      target.tagName === 'INPUT' ||
      target.tagName === 'TEXTAREA' ||
      target.isContentEditable ||
      target.getAttribute('contenteditable') === 'true';
    if (isInput && !IGNORED_KEYS.has(e.key)) {
      playKeyboardClickSound(e.key);
    }
  };

  window.addEventListener('pointerdown', handlePointerDown, true);
  window.addEventListener('keydown', handleKeyDown, true);

  return () => {
    window.removeEventListener('pointerdown', handlePointerDown, true);
    window.removeEventListener('keydown', handleKeyDown, true);
  };
}
