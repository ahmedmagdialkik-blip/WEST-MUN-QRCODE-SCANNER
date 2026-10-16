/**
 * Mozart Classical Chamber Music Synthesizer (Web Audio API)
 * Plays an authentic, elegant classical chamber string arrangement of Mozart's
 * "Eine kleine Nachtmusik" (Serenade No. 13 in G Major, K. 525) & Romanze (Andante)
 * to accompany the executive AI voice welcome greeting.
 */

class MozartChamberMusic {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private isPlaying: boolean = false;
  private activeOscillators: OscillatorNode[] = [];
  private sequenceTimers: number[] = [];

  // Note frequency map (A4 = 440Hz, equal temperament)
  private noteFreq(note: string): number {
    const notes: Record<string, number> = {
      'G2': 98.00,  'A2': 110.00, 'B2': 123.47,
      'C3': 130.81, 'D3': 146.83, 'E3': 164.81, 'F3': 174.61, 'F#3': 185.00, 'G3': 196.00, 'A3': 220.00, 'B3': 246.94,
      'C4': 261.63, 'C#4': 277.18, 'D4': 293.66, 'E4': 329.63, 'F4': 349.23, 'F#4': 369.99, 'G4': 392.00, 'A4': 440.00, 'B4': 493.88,
      'C5': 523.25, 'C#5': 554.37, 'D5': 587.33, 'E5': 659.25, 'F5': 698.46, 'F#5': 739.99, 'G5': 783.99, 'A5': 880.00, 'B5': 987.77,
      'C6': 1046.50, 'D6': 1174.66, 'E6': 1318.51
    };
    return notes[note] || 440;
  }

  // Play a single string note with warm acoustic harmonics, ADSR envelope and subtle vibrato
  private playStringVoice(
    freq: number,
    startTime: number,
    duration: number,
    voiceGain: number,
    type: 'violin' | 'viola' | 'cello' = 'violin'
  ) {
    if (!this.ctx || !this.masterGain) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    // Warm chamber acoustic filter
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(
      type === 'cello' ? 850 : type === 'viola' ? 1450 : 2300,
      startTime
    );
    filter.Q.setValueAtTime(1.15, startTime);

    // Warm string timbre (sawtooth + subtle warm harmonic shaping)
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(freq, startTime);

    // Subtle gentle vibrato (5.5Hz, gentle pitch modulation for natural string feel)
    const vibrato = this.ctx.createOscillator();
    const vibratoGain = this.ctx.createGain();
    vibrato.frequency.setValueAtTime(5.4, startTime);
    vibratoGain.gain.setValueAtTime(freq * 0.012, startTime);
    vibrato.connect(osc.frequency);
    vibrato.start(startTime + 0.08);
    vibrato.stop(startTime + duration);

    // Classical ADSR envelope: soft acoustic attack, gentle decay, lyrical sustain, graceful release
    const attack = 0.09;
    const release = Math.min(0.28, duration * 0.4);
    gain.gain.setValueAtTime(0.0001, startTime);
    gain.gain.linearRampToValueAtTime(voiceGain, startTime + attack);
    gain.gain.setValueAtTime(voiceGain * 0.88, startTime + duration - release);
    gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    osc.start(startTime);
    osc.stop(startTime + duration);

    this.activeOscillators.push(osc, vibrato);
  }

  /**
   * Start Mozart's regal Eine kleine Nachtmusik (K. 525) & Romanze theme
   */
  public start(maxVolume = 0.22) {
    if (this.isPlaying) return;

    try {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioContextClass) return;

      this.ctx = new AudioContextClass();
      if (this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }

      this.masterGain = this.ctx.createGain();
      // Gentle fade in
      this.masterGain.gain.setValueAtTime(0.001, this.ctx.currentTime);
      this.masterGain.gain.linearRampToValueAtTime(maxVolume, this.ctx.currentTime + 0.6);
      this.masterGain.connect(this.ctx.destination);

      this.isPlaying = true;
      const t0 = this.ctx.currentTime + 0.08;

      // Mozart: Eine kleine Nachtmusik, K. 525 - Allegro into Romanze (Andante) in G Major
      const beat = 0.44; // regal chamber tempo

      // Violin I Theme (Melody Lead)
      const melody: Array<{ note: string; startBeat: number; dur: number; type?: 'violin' | 'viola' | 'cello' }> = [
        // Bar 1-2: Majestic opening fanfare
        { note: 'G4', startBeat: 0, dur: 0.75 },
        { note: 'D4', startBeat: 0.85, dur: 0.38 },
        { note: 'G4', startBeat: 1.3, dur: 0.75 },
        { note: 'D4', startBeat: 2.15, dur: 0.38 },
        { note: 'G4', startBeat: 2.58, dur: 0.38 },
        { note: 'B4', startBeat: 3.01, dur: 0.38 },
        { note: 'D5', startBeat: 3.44, dur: 0.75 },

        // Bar 3-4: Subdominant response
        { note: 'C5', startBeat: 4.45, dur: 0.75 },
        { note: 'A4', startBeat: 5.3, dur: 0.38 },
        { note: 'C5', startBeat: 5.73, dur: 0.75 },
        { note: 'A4', startBeat: 6.58, dur: 0.38 },
        { note: 'F#4', startBeat: 7.01, dur: 0.38 },
        { note: 'A4', startBeat: 7.44, dur: 0.38 },
        { note: 'D4', startBeat: 7.87, dur: 0.75 },

        // Bar 5-8: Lyrical Romanze melody (flowing, elegant, dignified)
        { note: 'G4', startBeat: 9.0, dur: 0.55 },
        { note: 'A4', startBeat: 9.65, dur: 0.38 },
        { note: 'B4', startBeat: 10.1, dur: 0.75 },
        { note: 'C5', startBeat: 10.95, dur: 0.55 },
        { note: 'B4', startBeat: 11.6, dur: 0.38 },
        { note: 'A4', startBeat: 12.05, dur: 0.75 },
        { note: 'G4', startBeat: 12.9, dur: 0.38 },
        { note: 'F#4', startBeat: 13.33, dur: 0.38 },
        { note: 'G4', startBeat: 13.76, dur: 1.4 },

        // Bar 9-12: Mozartian continuation & lyrical ornament
        { note: 'B4', startBeat: 15.3, dur: 0.55 },
        { note: 'C5', startBeat: 15.9, dur: 0.38 },
        { note: 'D5', startBeat: 16.35, dur: 0.75 },
        { note: 'E5', startBeat: 17.2, dur: 0.55 },
        { note: 'D5', startBeat: 17.85, dur: 0.38 },
        { note: 'C5', startBeat: 18.3, dur: 0.55 },
        { note: 'B4', startBeat: 18.95, dur: 0.55 },
        { note: 'A4', startBeat: 19.6, dur: 0.75 },

        // Cadential resolution in G major
        { note: 'B4', startBeat: 20.6, dur: 0.6 },
        { note: 'A4', startBeat: 21.3, dur: 0.6 },
        { note: 'G4', startBeat: 22.0, dur: 2.8 },
      ];

      // Bass & Harmony Accompaniment (Cello & Viola)
      const harmony: Array<{ note: string; startBeat: number; dur: number; type: 'viola' | 'cello' }> = [
        // Bar 1-2 Cello Bassline
        { note: 'G3', startBeat: 0, dur: 0.75, type: 'cello' },
        { note: 'D3', startBeat: 0.85, dur: 0.38, type: 'cello' },
        { note: 'G3', startBeat: 1.3, dur: 0.75, type: 'cello' },
        { note: 'D3', startBeat: 2.15, dur: 0.38, type: 'cello' },
        { note: 'G3', startBeat: 2.58, dur: 0.38, type: 'cello' },
        { note: 'B3', startBeat: 3.01, dur: 0.38, type: 'cello' },
        { note: 'D3', startBeat: 3.44, dur: 0.75, type: 'cello' },

        // Bar 3-4 Cello
        { note: 'D3', startBeat: 4.45, dur: 0.75, type: 'cello' },
        { note: 'F#3', startBeat: 5.3, dur: 0.38, type: 'cello' },
        { note: 'D3', startBeat: 5.73, dur: 0.75, type: 'cello' },
        { note: 'F#3', startBeat: 6.58, dur: 0.38, type: 'cello' },
        { note: 'D3', startBeat: 7.01, dur: 0.38, type: 'cello' },
        { note: 'F#3', startBeat: 7.44, dur: 0.38, type: 'cello' },
        { note: 'D3', startBeat: 7.87, dur: 0.75, type: 'cello' },

        // Viola chamber chords (warm gentle pulses under Romanze)
        { note: 'B3', startBeat: 9.0, dur: 1.8, type: 'viola' },
        { note: 'D4', startBeat: 9.0, dur: 1.8, type: 'viola' },
        { note: 'G3', startBeat: 9.0, dur: 1.8, type: 'cello' },

        { note: 'C4', startBeat: 10.95, dur: 1.8, type: 'viola' },
        { note: 'E4', startBeat: 10.95, dur: 1.8, type: 'viola' },
        { note: 'C3', startBeat: 10.95, dur: 1.8, type: 'cello' },

        { note: 'B3', startBeat: 12.9, dur: 2.1, type: 'viola' },
        { note: 'D4', startBeat: 12.9, dur: 2.1, type: 'viola' },
        { note: 'G3', startBeat: 12.9, dur: 2.1, type: 'cello' },

        // Continuation harmony
        { note: 'G3', startBeat: 15.3, dur: 1.8, type: 'cello' },
        { note: 'B3', startBeat: 15.3, dur: 1.8, type: 'viola' },
        { note: 'C3', startBeat: 17.2, dur: 1.8, type: 'cello' },
        { note: 'E4', startBeat: 17.2, dur: 1.8, type: 'viola' },
        { note: 'D3', startBeat: 19.6, dur: 1.8, type: 'cello' },
        { note: 'F#4', startBeat: 19.6, dur: 1.8, type: 'viola' },

        // Final Cello tonic resolution (G2 & D3)
        { note: 'G2', startBeat: 21.3, dur: 3.5, type: 'cello' },
        { note: 'D3', startBeat: 21.3, dur: 3.5, type: 'viola' },
        { note: 'B3', startBeat: 22.0, dur: 2.8, type: 'viola' },
      ];

      // Schedule melody voices
      for (const m of melody) {
        const time = t0 + m.startBeat * beat;
        this.playStringVoice(this.noteFreq(m.note), time, m.dur, 0.42, 'violin');
      }

      // Schedule harmony voices
      for (const h of harmony) {
        const time = t0 + h.startBeat * beat;
        this.playStringVoice(this.noteFreq(h.note), time, h.dur, h.type === 'cello' ? 0.38 : 0.28, h.type);
      }
    } catch (e) {
      console.warn('Mozart Web Audio API error:', e);
    }
  }

  /**
   * Fade out smoothly over duration (default 1.2 seconds)
   */
  public fadeOut(durationMs = 1200) {
    if (!this.isPlaying || !this.ctx || !this.masterGain) return;

    try {
      const now = this.ctx.currentTime;
      this.masterGain.gain.cancelScheduledValues(now);
      this.masterGain.gain.setValueAtTime(this.masterGain.gain.value, now);
      this.masterGain.gain.exponentialRampToValueAtTime(0.0001, now + durationMs / 1000);

      setTimeout(() => {
        this.stop();
      }, durationMs + 100);
    } catch {
      this.stop();
    }
  }

  /**
   * Immediately stops music and cleans up audio context
   */
  public stop() {
    this.isPlaying = false;
    for (const timer of this.sequenceTimers) {
      clearTimeout(timer);
    }
    this.sequenceTimers = [];

    for (const osc of this.activeOscillators) {
      try {
        osc.stop();
        osc.disconnect();
      } catch {
        // ignore
      }
    }
    this.activeOscillators = [];

    if (this.ctx && this.ctx.state !== 'closed') {
      try {
        this.ctx.close();
      } catch {
        // ignore
      }
    }
    this.ctx = null;
    this.masterGain = null;
  }
}

let mozartInstance: MozartChamberMusic | null = null;

export function playMozartWelcomeMusic(maxVolume = 0.22): {
  fadeOut: (durationMs?: number) => void;
  stop: () => void;
} {
  if (mozartInstance) {
    mozartInstance.stop();
  }

  mozartInstance = new MozartChamberMusic();
  mozartInstance.start(maxVolume);

  return {
    fadeOut: (dur?: number) => {
      if (mozartInstance) mozartInstance.fadeOut(dur);
    },
    stop: () => {
      if (mozartInstance) {
        mozartInstance.stop();
        mozartInstance = null;
      }
    },
  };
}
