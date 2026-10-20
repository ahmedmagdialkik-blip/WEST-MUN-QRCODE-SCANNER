/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Audio is strictly disabled across the entire application per specification:
 * "No audio should play anywhere in the application."
 */

export function playSuccessChime(): void {
  // Audio disabled
}

export function playWarningBuzzer(): void {
  // Audio disabled
}

export function playErrorAlarm(): void {
  // Audio disabled
}

export function playClickSound(): void {
  // Audio disabled
}

export function playScanTick(): void {
  // Audio disabled
}

export function playDeniedAccessTone(): void {
  // Audio disabled
}

export function playSubtleBeep(): void {
  // Audio disabled
}

export function playSecurityAlertSiren(): void {
  // Audio disabled
}

/**
 * Plays a subtle, elegant high-end harmonic chime for Task Completion.
 * Uses Web Audio API without requiring external audio files.
 */
export function playTaskCompletionChime(): void {
  if (typeof window === 'undefined') return;
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    const now = ctx.currentTime;

    // Harmonic bell chime: delicate two-tone shimmer
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const osc3 = ctx.createOscillator();
    const gain = ctx.createGain();

    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(587.33, now); // D5
    osc1.frequency.exponentialRampToValueAtTime(880, now + 0.12); // A5

    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(1174.66, now + 0.08); // D6

    osc3.type = 'sine';
    osc3.frequency.setValueAtTime(1760, now + 0.15); // A6 bell sparkle

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(0.18, now + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.00001, now + 0.7);

    osc1.connect(gain);
    osc2.connect(gain);
    osc3.connect(gain);
    gain.connect(ctx.destination);

    osc1.start(now);
    osc2.start(now + 0.08);
    osc3.start(now + 0.15);
    osc1.stop(now + 0.75);
    osc2.stop(now + 0.75);
    osc3.stop(now + 0.75);
  } catch {
    // Ignore audio context errors gracefully
  }
}

/**
 * Mechanical lock click sound for the door unlocking animation.
 */
export function playLockClickSound(): void {
  if (typeof window === 'undefined') return;
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(1400, now);
    osc.frequency.exponentialRampToValueAtTime(320, now + 0.06);

    gain.gain.setValueAtTime(0.28, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.09);

    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(920, now + 0.04);
    osc2.frequency.exponentialRampToValueAtTime(180, now + 0.11);
    gain2.gain.setValueAtTime(0.001, now);
    gain2.gain.setValueAtTime(0.22, now + 0.04);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.04);
    osc2.stop(now + 0.13);
  } catch {
    // Ignore
  }
}

/**
 * Ethereal harmonious entry chime for when the diplomatic door opens.
 */
export function playDoorUnlockChime(): void {
  if (typeof window === 'undefined') return;
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }
    const now = ctx.currentTime;

    const freqs = [523.25, 659.25, 783.99, 1046.5];
    freqs.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.06);

      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.linearRampToValueAtTime(0.12, now + idx * 0.06 + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.00001, now + idx * 0.06 + 1.2);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + idx * 0.06);
      osc.stop(now + idx * 0.06 + 1.3);
    });
  } catch {
    // Ignore
  }
}
