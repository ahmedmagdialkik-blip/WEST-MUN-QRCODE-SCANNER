// Web Audio API Synthesizer for instant low-latency venue scanner feedback

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

/**
 * Access Granted: Bright, uplifting harmonic chime (C5 -> E5 -> G5)
 */
export function playSuccessChime() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const notes = [523.25, 659.25, 783.99]; // C5, E5, G5

    notes.forEach((freq, index) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + index * 0.08);

      gain.gain.setValueAtTime(0, now + index * 0.08);
      gain.gain.linearRampToValueAtTime(0.3, now + index * 0.08 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + index * 0.08 + 0.6);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + index * 0.08);
      osc.stop(now + index * 0.08 + 0.65);
    });
  } catch (err) {
    console.warn('Audio playback failed', err);
  }
}

/**
 * Already Checked In: Attention-grabbing cautionary double pulse & siren
 */
export function playWarningBuzzer() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    
    // Alert pulses with siren frequency modulation
    [0, 0.16, 0.32].forEach((offset) => {
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = 'sawtooth';
      osc2.type = 'square';
      osc1.frequency.setValueAtTime(320, now + offset);
      osc1.frequency.linearRampToValueAtTime(440, now + offset + 0.12);
      osc2.frequency.setValueAtTime(340, now + offset);
      osc2.frequency.linearRampToValueAtTime(480, now + offset + 0.12);

      gain.gain.setValueAtTime(0, now + offset);
      gain.gain.linearRampToValueAtTime(0.35, now + offset + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + offset + 0.14);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start(now + offset);
      osc2.start(now + offset);
      osc1.stop(now + offset + 0.15);
      osc2.stop(now + offset + 0.15);
    });
  } catch (err) {
    console.warn('Audio playback failed', err);
  }
}

/**
 * Security Alert Siren: Rapid repeating emergency alarm for unauthorized re-entry attempt
 */
export function playSecurityAlertSiren() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sawtooth';
    // Frequency modulation siren
    osc.frequency.setValueAtTime(800, now);
    osc.frequency.linearRampToValueAtTime(400, now + 0.2);
    osc.frequency.linearRampToValueAtTime(800, now + 0.4);
    osc.frequency.linearRampToValueAtTime(350, now + 0.6);

    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.4, now + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.65);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.7);
  } catch (err) {
    console.warn('Siren playback failed', err);
  }
}

/**
 * Invalid Ticket: Harsh low reject buzz
 */
export function playErrorAlarm() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(150, now);
    osc.frequency.linearRampToValueAtTime(90, now + 0.35); // downward pitch drop

    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.4, now + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.38);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.4);
  } catch (err) {
    console.warn('Audio playback failed', err);
  }
}

/**
 * Gentle click for UI buttons
 */
export function playClickSound() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(800, now);

    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.05);
  } catch (err) {
    // ignore
  }
}

/**
 * Faint medieval choir ambience synthesized via Web Audio API.
 * Warm, resonant cathedral harmonics with subtle choral undertones.
 * Returns an object with a stop() method for early cancellation.
 */
export function playMedievalChoirAmbience(): { stop: () => void } {
  try {
    const ctx = getAudioContext();
    if (!ctx) return { stop: () => {} };

    const now = ctx.currentTime;
    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(0.0001, now);
    // Gentle crescendo from 0.0s to 1.8s
    masterGain.gain.linearRampToValueAtTime(0.22, now + 1.8);
    masterGain.gain.setValueAtTime(0.22, now + 4.5);
    // Smooth fade out by 6.0s
    masterGain.gain.exponentialRampToValueAtTime(0.0001, now + 6.0);

    // Warm cathedral acoustic low-pass filter
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(320, now);
    filter.frequency.exponentialRampToValueAtTime(680, now + 3.0);
    filter.frequency.exponentialRampToValueAtTime(280, now + 5.8);
    filter.Q.setValueAtTime(3.0, now);

    masterGain.connect(filter);
    filter.connect(ctx.destination);

    // Medieval open fifth / minor church chord frequencies (D minor / Dorian)
    const choirVoices = [
      { freq: 73.42, type: 'sine' as OscillatorType, detune: -4, gain: 0.35 },    // D2 Bass
      { freq: 110.0, type: 'sine' as OscillatorType, detune: 3, gain: 0.3 },     // A2 Fifth
      { freq: 146.83, type: 'triangle' as OscillatorType, detune: -2, gain: 0.25 }, // D3 Tenor
      { freq: 174.61, type: 'sine' as OscillatorType, detune: 5, gain: 0.2 },    // F3 Minor 3rd
      { freq: 220.0, type: 'sine' as OscillatorType, detune: -3, gain: 0.18 },   // A3 Alto
      { freq: 293.66, type: 'triangle' as OscillatorType, detune: 4, gain: 0.12 }, // D4 Soprano
    ];

    const oscillators: OscillatorNode[] = [];

    choirVoices.forEach((v) => {
      const osc = ctx.createOscillator();
      const vGain = ctx.createGain();

      osc.type = v.type;
      osc.frequency.setValueAtTime(v.freq, now);
      osc.detune.setValueAtTime(v.detune, now);

      vGain.gain.setValueAtTime(v.gain, now);

      osc.connect(vGain);
      vGain.connect(masterGain);

      osc.start(now);
      osc.stop(now + 6.2);
      oscillators.push(osc);
    });

    return {
      stop: () => {
        try {
          const stopTime = ctx.currentTime;
          masterGain.gain.cancelScheduledValues(stopTime);
          masterGain.gain.linearRampToValueAtTime(0.0001, stopTime + 0.3);
          setTimeout(() => {
            oscillators.forEach((o) => {
              try { o.stop(); } catch { /* ignore */ }
            });
          }, 350);
        } catch {
          // ignore
        }
      },
    };
  } catch (err) {
    console.warn('Medieval choir ambience playback failed', err);
    return { stop: () => {} };
  }
}

/**
 * Gentle golden resonant pulse chime when the emblem dissolves
 */
export function playGoldenPulseSound() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(0.2, now);
    masterGain.gain.exponentialRampToValueAtTime(0.0001, now + 1.8);
    masterGain.connect(ctx.destination);

    // Antique bronze bell / chime harmonics (warm D harmonic series)
    [293.66, 440.0, 587.33, 880.0].forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);

      gain.gain.setValueAtTime(0.25 / (idx + 1), now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.6);

      osc.connect(gain);
      gain.connect(masterGain);

      osc.start(now);
      osc.stop(now + 1.7);
    });
  } catch (err) {
    // ignore
  }
}
