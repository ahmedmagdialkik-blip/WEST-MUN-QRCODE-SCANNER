/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Grand Orchestral Fanfare Synthesizer for Under Secretary-General Welcome
 * Synthesizes a majestic 5-second royal brass & string fanfare using Web Audio API.
 * 100% self-contained, instant playback, zero external asset dependencies.
 */

export function playUnderSecretaryFanfare(): () => void {
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

  const activeNodes: (AudioNode | OscillatorNode)[] = [];
  let isAborted = false;

  const now = ctx.currentTime + 0.05;

  // Master Gain with limiter ceiling
  const masterGain = ctx.createGain();
  masterGain.gain.setValueAtTime(0.32, now);
  masterGain.connect(ctx.destination);
  activeNodes.push(masterGain);

  // Helper: Synthesizes a warm, majestic brass fanfare note
  const playBrassNote = (
    freq: number,
    startTime: number,
    duration = 0.6,
    gainLevel = 1.0
  ) => {
    if (isAborted || !ctx) return;
    const t = now + startTime;

    // Dual detuned sawtooth oscillators for rich horn/brass section chorus
    const osc1 = ctx.createOscillator();
    osc1.type = 'sawtooth';
    osc1.frequency.setValueAtTime(freq, t);

    const osc2 = ctx.createOscillator();
    osc2.type = 'sawtooth';
    osc2.frequency.setValueAtTime(freq * 1.004, t); // +7 cents detune

    // Warm triangle sub for deep orchestral foundation
    const subOsc = ctx.createOscillator();
    subOsc.type = 'triangle';
    subOsc.frequency.setValueAtTime(freq / 2, t);

    // Lowpass filter simulating acoustic brass bell resonance
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(freq * 1.8, t);
    filter.frequency.exponentialRampToValueAtTime(Math.min(6500, freq * 4.2), t + 0.08);
    filter.frequency.exponentialRampToValueAtTime(Math.max(400, freq * 2.2), t + duration);
    filter.Q.setValueAtTime(1.8, t);

    // Brass attack & decay envelope
    const noteGain = ctx.createGain();
    noteGain.gain.setValueAtTime(0.0001, t);
    // Crisp royal brass attack
    noteGain.gain.linearRampToValueAtTime(0.24 * gainLevel, t + 0.035);
    // Sustain
    noteGain.gain.setValueAtTime(0.22 * gainLevel, t + duration * 0.7);
    // Smooth decay
    noteGain.gain.exponentialRampToValueAtTime(0.0001, t + duration);

    osc1.connect(filter);
    osc2.connect(filter);
    subOsc.connect(filter);
    filter.connect(noteGain);
    noteGain.connect(masterGain);

    osc1.start(t);
    osc2.start(t);
    subOsc.start(t);

    osc1.stop(t + duration);
    osc2.stop(t + duration);
    subOsc.stop(t + duration);

    activeNodes.push(osc1, osc2, subOsc, filter, noteGain);
  };

  // Helper: Synthesizes a deep orchestral timpani strike
  const playTimpani = (startTime: number, baseFreq = 82) => {
    if (isAborted || !ctx) return;
    const t = now + startTime;

    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(baseFreq * 1.6, t);
    osc.frequency.exponentialRampToValueAtTime(baseFreq, t + 0.08);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.35, t);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.85);

    osc.connect(gain);
    gain.connect(masterGain);

    osc.start(t);
    osc.stop(t + 0.85);
    activeNodes.push(osc, gain);
  };

  // -------------------------------------------------------------
  // Royal Fanfare Motif (Key of C Major / Regal Ceremonial Fanfare)
  // -------------------------------------------------------------
  // Frequencies:
  // C4 = 261.63, E4 = 329.63, G4 = 392.00, C5 = 523.25, E5 = 659.25, G5 = 783.99

  // Phrase 1: Triumphant opening announcement
  playBrassNote(261.63, 0.0, 0.28, 0.9); // C4
  playBrassNote(392.0, 0.0, 0.28, 0.9);  // G4
  playTimpani(0.0, 75);

  playBrassNote(261.63, 0.32, 0.28, 0.9); // C4
  playBrassNote(392.0, 0.32, 0.28, 0.9);  // G4

  playBrassNote(261.63, 0.64, 0.38, 1.0); // C4
  playBrassNote(523.25, 0.64, 0.38, 1.1); // C5
  playTimpani(0.64, 85);

  // Phrase 2: Ascending ceremonial herald
  playBrassNote(329.63, 1.1, 0.35, 1.0); // E4
  playBrassNote(659.25, 1.1, 0.35, 1.1); // E5

  playBrassNote(392.0, 1.5, 0.35, 1.0);  // G4
  playBrassNote(783.99, 1.5, 0.35, 1.1); // G5

  // Phrase 3: Majestic royal triplet flourish
  playBrassNote(523.25, 1.95, 0.22, 1.1); // C5
  playBrassNote(659.25, 2.18, 0.22, 1.1); // E5
  playBrassNote(783.99, 2.4, 0.45, 1.2);  // G5
  playTimpani(2.4, 98);

  // Phrase 4: Grand Resolution (Full Orchestral Tutti Chord held with grandeur)
  const finalStart = 2.95;
  const finalDur = 1.95;

  playTimpani(finalStart, 65);
  playTimpani(finalStart + 0.1, 65);

  playBrassNote(261.63, finalStart, finalDur, 1.2); // C4
  playBrassNote(329.63, finalStart, finalDur, 1.1); // E4
  playBrassNote(392.0, finalStart, finalDur, 1.1);  // G4
  playBrassNote(523.25, finalStart, finalDur, 1.3); // C5
  playBrassNote(659.25, finalStart, finalDur, 1.2); // E5
  playBrassNote(1046.5, finalStart, finalDur, 1.0); // C6 shimmering bell harmonic

  // Fade out master gain smoothly at the end
  masterGain.gain.setValueAtTime(0.32, now + 4.3);
  masterGain.gain.exponentialRampToValueAtTime(0.0001, now + 5.0);

  return () => {
    isAborted = true;
    try {
      activeNodes.forEach((node) => {
        try {
          if ('stop' in node) (node as OscillatorNode).stop();
          node.disconnect();
        } catch {
          // ignore
        }
      });
      if (ctx && ctx.state !== 'closed') {
        ctx.close().catch(() => {});
      }
    } catch {
      // ignore
    }
  };
}
