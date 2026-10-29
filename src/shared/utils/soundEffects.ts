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

export function isKeyboardSoundEnabled(): boolean {
  if (typeof window === 'undefined') return true;
  const val = localStorage.getItem(STORAGE_KEYBOARD_SOUND_KEY);
  return val === null || val === 'true';
}

export function setKeyboardSoundEnabled(enabled: boolean): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEYBOARD_SOUND_KEY, enabled ? 'true' : 'false');
}

export function isClickSoundEnabled(): boolean {
  if (typeof window === 'undefined') return true;
  const val = localStorage.getItem(STORAGE_CLICK_SOUND_KEY);
  return val === null || val === 'true';
}

export function setClickSoundEnabled(enabled: boolean): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_CLICK_SOUND_KEY, enabled ? 'true' : 'false');
}

export function isCompletionSoundEnabled(): boolean {
  if (typeof window === 'undefined') return true;
  const val = localStorage.getItem(STORAGE_COMPLETION_SOUND_KEY);
  return val === null || val === 'true';
}

export function setCompletionSoundEnabled(enabled: boolean): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_COMPLETION_SOUND_KEY, enabled ? 'true' : 'false');
}

export function isTimerSoundEnabled(): boolean {
  if (typeof window === 'undefined') return true;
  const val = localStorage.getItem(STORAGE_TIMER_SOUND_KEY);
  return val === null || val === 'true';
}

export function setTimerSoundEnabled(enabled: boolean): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_TIMER_SOUND_KEY, enabled ? 'true' : 'false');
}

/**
 * Emits a subtle, satisfying mechanical switch click (Opera GX style typing sound)
 */
export function playKeyboardClickSound(force = false): void {
  if (!force && (isAudioMuted() || !isKeyboardSoundEnabled())) return;
  const ctx = getAudioContext();
  if (!ctx) return;
  if (ctx.state === 'suspended') {
    ctx.resume().catch(() => {});
  }

  try {
    const volume = getAudioVolume();
    if (volume <= 0) return;
    const now = ctx.currentTime;
    const duration = 0.048;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    osc.type = 'triangle';
    // Slight pitch variation (700-860Hz) for authentic mechanical switch feel
    const pitch = 700 + Math.random() * 160;
    osc.frequency.setValueAtTime(pitch, now);
    osc.frequency.exponentialRampToValueAtTime(110, now + duration);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(2600, now);

    gain.gain.setValueAtTime(0.5 * volume, now);
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
    const duration = 0.038;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(650, now);
    osc.frequency.exponentialRampToValueAtTime(160, now + duration);

    gain.gain.setValueAtTime(0.45 * volume, now);
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

/**
 * Attaches global window listeners for tactile UI clicks and mechanical keyboard sounds
 */
export function attachGlobalSoundListeners(): () => void {
  if (typeof window === 'undefined') return () => {};

  const handleClick = (e: MouseEvent) => {
    const target = e.target as HTMLElement | null;
    if (!target) return;
    const clickable = target.closest(
      'button, [role="button"], a, input, select, .cursor-pointer, .cursor-grab'
    );
    if (clickable) {
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
    if (
      isInput &&
      !['Shift', 'Control', 'Alt', 'Meta', 'Escape', 'Tab', 'CapsLock'].includes(e.key)
    ) {
      playKeyboardClickSound();
    }
  };

  window.addEventListener('click', handleClick, true);
  window.addEventListener('keydown', handleKeyDown, true);

  return () => {
    window.removeEventListener('click', handleClick, true);
    window.removeEventListener('keydown', handleKeyDown, true);
  };
}
