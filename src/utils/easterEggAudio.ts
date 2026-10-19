/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Cheerful Nursery Rhyme Instrumental & Soft Baby Giggle Synthesizer
 * Built with Web Audio API for zero-dependency, instantaneous, high-fidelity playback.
 * Dedicated exclusively for the Dana Alnajar freshman easter egg.
 */

export function playFreshmanNurseryRhyme(): () => void {
  if (typeof window === 'undefined') {
    return () => {};
  }

  const AudioContextClass =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;

  if (!AudioContextClass) {
    return () => {};
  }

  let ctx: AudioContext | null = null;
  try {
    ctx = new AudioContextClass();
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }
  } catch {
    return () => {};
  }

  const activeOscillators: OscillatorNode[] = [];
  let isStopped = false;

  const now = ctx.currentTime + 0.05;

  // Master Gain with gentle ceiling
  const masterGain = ctx.createGain();
  masterGain.gain.setValueAtTime(0.28, now);
  masterGain.connect(ctx.destination);

  // Helper to play a music-box / bell chime note
  const playChimeNote = (
    freq: number,
    startTime: number,
    duration = 0.55,
    volume = 1.0
  ) => {
    if (isStopped || !ctx) return;

    const t = now + startTime;

    // Primary fundamental sine oscillator
    const osc1 = ctx.createOscillator();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(freq, t);

    // Soft octave overtone for crystalline music-box glockenspiel sparkle
    const osc2 = ctx.createOscillator();
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(freq * 2, t);

    const noteGain = ctx.createGain();
    noteGain.gain.setValueAtTime(0.0001, t);
    // Fast attack
    noteGain.gain.linearRampToValueAtTime(0.3 * volume, t + 0.015);
    // Gentle exponential music-box decay
    noteGain.gain.exponentialRampToValueAtTime(0.0001, t + duration);

    osc1.connect(noteGain);
    osc2.connect(noteGain);
    noteGain.connect(masterGain);

    osc1.start(t);
    osc2.start(t);

    osc1.stop(t + duration);
    osc2.stop(t + duration);

    activeOscillators.push(osc1, osc2);
  };

  // Helper to play soft warm bass harmonic accompaniment
  const playBassNote = (freq: number, startTime: number, duration = 0.8) => {
    if (isStopped || !ctx) return;
    const t = now + startTime;
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, t);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.linearRampToValueAtTime(0.18, t + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);

    osc.connect(gain);
    gain.connect(masterGain);

    osc.start(t);
    osc.stop(t + duration);
    activeOscillators.push(osc);
  };

  // -------------------------------------------------------------
  // Nursery Rhyme Melody: Cheerful Twinkle / Lullaby Music Box
  // -------------------------------------------------------------
  // Musical Frequencies (Hz):
  // C4 = 261.63, E4 = 329.63, G4 = 392.00, A4 = 440.00, B4 = 493.88
  // C5 = 523.25, D5 = 587.33, E5 = 659.25, F5 = 698.46, G5 = 783.99, A5 = 880.00, C6 = 1046.50

  const melodyNotes: [number, number, number?][] = [
    // Phrase 1 (0.0s - 1.4s)
    [523.25, 0.0, 0.45], // C5
    [523.25, 0.38, 0.45], // C5
    [783.99, 0.76, 0.45], // G5
    [783.99, 1.14, 0.45], // G5

    // Phrase 2 (1.5s - 2.8s)
    [880.0, 1.52, 0.45], // A5
    [880.0, 1.9, 0.45], // A5
    [783.99, 2.28, 0.75], // G5 (held)

    // Phrase 3 (2.9s - 4.2s)
    [698.46, 2.9, 0.42], // F5
    [698.46, 3.28, 0.42], // F5
    [659.25, 3.66, 0.42], // E5
    [659.25, 4.04, 0.42], // E5

    // Phrase 4 (4.3s - 5.2s)
    [587.33, 4.42, 0.4], // D5
    [587.33, 4.75, 0.4], // D5
    [523.25, 5.08, 0.9], // C5 (resolving long sweet chime)
  ];

  melodyNotes.forEach(([freq, time, dur]) => {
    playChimeNote(freq, time, dur || 0.5);
  });

  // Soft Bass Accompaniment on Downbeats
  playBassNote(261.63, 0.0, 1.2); // C4
  playBassNote(392.0, 1.52, 1.1); // G4
  playBassNote(349.23, 2.9, 1.1); // F4
  playBassNote(261.63, 4.42, 1.3); // C4

  // -------------------------------------------------------------
  // Soft Baby Giggle / Playful Coo (~5.3s - 6.2s)
  // Synthesized via frequency-modulated cute chuckles & sparkles
  // -------------------------------------------------------------
  const giggles: { start: number; startFreq: number; peakFreq: number; endFreq: number; dur: number }[] = [
    { start: 5.3, startFreq: 680, peakFreq: 920, endFreq: 750, dur: 0.12 },
    { start: 5.48, startFreq: 820, peakFreq: 1080, endFreq: 880, dur: 0.14 },
    { start: 5.68, startFreq: 760, peakFreq: 1020, endFreq: 820, dur: 0.13 },
    { start: 5.88, startFreq: 850, peakFreq: 1150, endFreq: 780, dur: 0.16 },
  ];

  giggles.forEach((g) => {
    if (isStopped || !ctx) return;
    const t = now + g.start;

    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(g.startFreq, t);
    osc.frequency.exponentialRampToValueAtTime(g.peakFreq, t + g.dur * 0.45);
    osc.frequency.exponentialRampToValueAtTime(g.endFreq, t + g.dur);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.linearRampToValueAtTime(0.18, t + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + g.dur);

    osc.connect(gain);
    gain.connect(masterGain);

    osc.start(t);
    osc.stop(t + g.dur);
    activeOscillators.push(osc);
  });

  // Final sparkling twinkle chime right after the giggle
  playChimeNote(1046.5, 6.05, 0.7, 0.85); // High C6 sparkle!

  // Return cancel/cleanup function
  return () => {
    isStopped = true;
    try {
      activeOscillators.forEach((osc) => {
        try {
          osc.stop();
          osc.disconnect();
        } catch {
          // ignore already stopped
        }
      });
      masterGain.disconnect();
      if (ctx && ctx.state !== 'closed') {
        ctx.close().catch(() => {});
      }
    } catch {
      // ignore
    }
  };
}

/**
 * Play a funny, cheerful, comedic "Ta-Daaa!" fanfare sound effect (~2.5s).
 * Synthesizes a playful cartoon brass fanfare with triumphant vibrato and celebratory sparkle.
 * Used exclusively for the Dana Al Najjar "See, Freshman... I changed your name!" easter egg.
 */
export function playFunnyTaDaSound(): () => void {
  if (typeof window === 'undefined') {
    return () => {};
  }

  const AudioContextClass =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;

  if (!AudioContextClass) {
    return () => {};
  }

  let ctx: AudioContext | null = null;
  try {
    ctx = new AudioContextClass();
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }
  } catch {
    return () => {};
  }

  const activeOscillators: OscillatorNode[] = [];
  let isStopped = false;

  const now = ctx.currentTime + 0.05;

  const masterGain = ctx.createGain();
  masterGain.gain.setValueAtTime(0.32, now);
  masterGain.connect(ctx.destination);

  // Helper for brass note
  const playBrassNote = (freq: number, start: number, duration: number, isFinalChord = false) => {
    if (isStopped || !ctx) return;
    const t = now + start;

    // Sawtooth + square mix for cartoon comedic brass trumpet
    const osc1 = ctx.createOscillator();
    osc1.type = 'sawtooth';
    osc1.frequency.setValueAtTime(freq, t);

    const osc2 = ctx.createOscillator();
    osc2.type = 'square';
    osc2.frequency.setValueAtTime(freq * 1.002, t);

    // If final chord, add playful vibrato
    if (isFinalChord) {
      const lfo = ctx.createOscillator();
      lfo.frequency.setValueAtTime(6, t); // 6 Hz vibrato
      const lfoGain = ctx.createGain();
      lfoGain.gain.setValueAtTime(7, t);
      lfo.connect(lfoGain);
      lfoGain.connect(osc1.frequency);
      lfoGain.connect(osc2.frequency);
      lfo.start(t + 0.2);
      lfo.stop(t + duration);
      activeOscillators.push(lfo);
    }

    const noteGain = ctx.createGain();
    noteGain.gain.setValueAtTime(0.001, t);
    noteGain.gain.linearRampToValueAtTime(0.28, t + 0.03);
    noteGain.gain.exponentialRampToValueAtTime(0.001, t + duration);

    osc1.connect(noteGain);
    osc2.connect(noteGain);
    noteGain.connect(masterGain);

    osc1.start(t);
    osc2.start(t);
    osc1.stop(t + duration);
    osc2.stop(t + duration);

    activeOscillators.push(osc1, osc2);
  };

  // Helper for sparkling twinkle arpeggio
  const playTwinkle = (freq: number, start: number) => {
    if (isStopped || !ctx) return;
    const t = now + start;
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, t);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.001, t);
    g.gain.linearRampToValueAtTime(0.18, t + 0.015);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
    osc.connect(g);
    g.connect(masterGain);
    osc.start(t);
    osc.stop(t + 0.35);
    activeOscillators.push(osc);
  };

  // Playful comedic fanfare sequence:
  // "Dum... da-da... TA-DAAA!"
  playBrassNote(392.0, 0.0, 0.14);   // G4
  playBrassNote(493.88, 0.16, 0.14); // B4
  playBrassNote(587.33, 0.32, 0.16); // D5

  // Big joyful "TA-DAAA!" chord held for ~2 seconds
  playBrassNote(783.99, 0.52, 2.0, true);  // G5
  playBrassNote(987.77, 0.52, 2.0, true);  // B5
  playBrassNote(1174.66, 0.52, 2.0, true); // D6

  // Cheerful glitter sparkles cascading down
  playTwinkle(1567.98, 0.6); // G6
  playTwinkle(1760.0, 0.75); // A6
  playTwinkle(1975.53, 0.9); // B6
  playTwinkle(2349.32, 1.05); // D7
  playTwinkle(2637.02, 1.25); // E7

  return () => {
    isStopped = true;
    try {
      activeOscillators.forEach((osc) => {
        try {
          osc.stop();
          osc.disconnect();
        } catch {
          // ignore
        }
      });
      masterGain.disconnect();
      if (ctx && ctx.state !== 'closed') {
        ctx.close().catch(() => {});
      }
    } catch {
      // ignore
    }
  };
}

