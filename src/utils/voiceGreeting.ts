/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Voice Welcome Greeting Utility
 * Leverages the browser's Web Speech API (SpeechSynthesis)
 * Selects highest-fidelity natural voices (Microsoft Aria, Google US English, Apple Samantha)
 */

const STORAGE_KEY_VOICE_MUTED = 'west_mun_voice_greeting_muted';

export function isVoiceMuted(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY_VOICE_MUTED) === 'true';
  } catch {
    return false;
  }
}

export function setVoiceMuted(muted: boolean): void {
  try {
    localStorage.setItem(STORAGE_KEY_VOICE_MUTED, muted ? 'true' : 'false');
  } catch {
    // ignore
  }
}

/**
 * Generates dynamic time-of-day greeting based on user's local clock
 */
export function generateGreeting(displayName: string): {
  salutation: string;
  fullSpeech: string;
  timeOfDay: 'morning' | 'afternoon' | 'evening';
} {
  const hour = new Date().getHours();
  let salutation = 'Good day';
  let timeOfDay: 'morning' | 'afternoon' | 'evening' = 'afternoon';

  if (hour >= 4 && hour < 12) {
    salutation = 'Good morning';
    timeOfDay = 'morning';
  } else if (hour >= 12 && hour < 18) {
    salutation = 'Good afternoon';
    timeOfDay = 'afternoon';
  } else {
    salutation = 'Good evening';
    timeOfDay = 'evening';
  }

  // Authentic natural greeting
  const fullSpeech = `${salutation}, ${displayName}. Welcome back to West MUN.`;

  return { salutation, fullSpeech, timeOfDay };
}

/**
 * Selects the best natural English voice available on the user's operating system/browser
 */
export function getBestNaturalVoice(): SpeechSynthesisVoice | null {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    return null;
  }

  const voices = window.speechSynthesis.getVoices();
  if (!voices || voices.length === 0) return null;

  // Tier 1: Preferred High-Fidelity Natural & Neural Voices
  const preferredVoiceNames = [
    'microsoft aria online',
    'microsoft aria',
    'microsoft jenny online',
    'microsoft guy online',
    'google us english',
    'google uk english female',
    'samantha',
    'karen',
    'daniel',
    'moira',
    'serena',
    'victoria',
    'alex',
  ];

  for (const preferred of preferredVoiceNames) {
    const match = voices.find((v) =>
      v.name.toLowerCase().includes(preferred)
    );
    if (match) return match;
  }

  // Tier 2: Any voice tagged with "natural" or "neural"
  const naturalMatch = voices.find(
    (v) =>
      v.lang.startsWith('en') &&
      (v.name.toLowerCase().includes('natural') ||
        v.name.toLowerCase().includes('neural') ||
        v.name.toLowerCase().includes('enhanced'))
  );
  if (naturalMatch) return naturalMatch;

  // Tier 3: Any English voice marked as default
  const defaultEn = voices.find((v) => v.lang.startsWith('en') && v.default);
  if (defaultEn) return defaultEn;

  // Tier 4: Any English voice
  const anyEn = voices.find((v) => v.lang.startsWith('en'));
  if (anyEn) return anyEn;

  return voices[0] || null;
}

/**
 * Speaks greeting aloud and returns a cleanup cancel function.
 * Audio is completely disabled/removed per specification: "remove the audio".
 */
export function speakGreeting(
  _text: string,
  onEnd?: () => void
): () => void {
  // Ensure any browser speech is immediately cancelled and never played
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    try {
      window.speechSynthesis.cancel();
    } catch {
      // ignore
    }
  }

  // Immediately or after short delay notify completion without producing any audio
  if (onEnd) {
    const timer = setTimeout(() => {
      onEnd();
    }, 1800);
    return () => clearTimeout(timer);
  }

  return () => {};
}
