/**
 * Web Speech API Utility for West MUN Executive Portal
 * Provides natural voice selection and greeting synthesis.
 */

const MUTED_STORAGE_KEY = 'westmun_voice_greeting_muted';

// Persistent reference to active utterance to prevent Chrome's garbage-collection bug
let activeUtterance: SpeechSynthesisUtterance | null = null;
let speechHeartbeatTimer: NodeJS.Timeout | null = null;

export interface TimeGreeting {
  salutation: string;
  fullGreeting: string;
  timePeriod: 'morning' | 'afternoon' | 'evening';
}

/**
 * Generates an inspiring, formal diplomatic greeting based on the user's local time.
 * Automatically incorporates the authenticated user's display name.
 */
export function getTimeOfDayGreeting(userName: string): TimeGreeting {
  const hour = new Date().getHours();
  const cleanName = userName ? userName.trim() : 'Delegate';

  let timePeriod: 'morning' | 'afternoon' | 'evening';
  let salutation: string;
  let fullGreeting: string;

  if (hour >= 5 && hour < 12) {
    timePeriod = 'morning';
    salutation = `Good morning, ${cleanName}`;
    fullGreeting = `Good morning, ${cleanName}. Welcome back to West MUN.`;
  } else if (hour >= 12 && hour < 18) {
    timePeriod = 'afternoon';
    salutation = `Good afternoon, ${cleanName}`;
    fullGreeting = `Good afternoon, ${cleanName}. Welcome back to West MUN.`;
  } else {
    timePeriod = 'evening';
    salutation = `Good evening, ${cleanName}`;
    fullGreeting = `Good evening, ${cleanName}. Welcome back to West MUN.`;
  }

  return { salutation, fullGreeting, timePeriod };
}

/**
 * Retrieves the mute preference from localStorage.
 */
export function isVoiceMuted(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return localStorage.getItem(MUTED_STORAGE_KEY) === 'true';
  } catch {
    return false;
  }
}

/**
 * Saves the mute preference in localStorage.
 */
export function setVoiceMuted(muted: boolean): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(MUTED_STORAGE_KEY, muted ? 'true' : 'false');
  } catch {
    // ignore
  }
}

/**
 * Selects the highest-quality natural English voice on the user's device.
 * Prioritizes natural voices like Microsoft Aria, Google US English, Apple Samantha, Daniel, etc.
 */
export function selectBestNaturalVoice(): SpeechSynthesisVoice | null {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return null;

  const voices = window.speechSynthesis.getVoices();
  if (!voices || voices.length === 0) return null;

  // Preferred natural sounding voices in order of fidelity
  const preferredVoiceSignatures = [
    'aria', // Microsoft Aria Online (Natural)
    'natural',
    'jenny',
    'guy',
    'google us english',
    'google uk english',
    'samantha', // Apple Samantha
    'daniel', // Apple Daniel (British)
    'karen', // Apple Karen
    'moira',
    'serena',
    'oliver',
    'steffi',
  ];

  for (const sig of preferredVoiceSignatures) {
    const matched = voices.find(
      (v) =>
        v.name.toLowerCase().includes(sig) &&
        (v.lang.startsWith('en') || v.lang === '')
    );
    if (matched) return matched;
  }

  // Fallback to any English voice
  const anyEnglish = voices.find((v) => v.lang.startsWith('en'));
  if (anyEnglish) return anyEnglish;

  return voices[0] || null;
}

/**
 * Plays a natural voice greeting using SpeechSynthesis.
 * Returns a cancel function.
 */
export function speakNaturalGreeting(
  text: string,
  callbacks?: {
    onStart?: () => void;
    onEnd?: () => void;
    onError?: (err: unknown) => void;
  }
): () => void {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    if (callbacks?.onEnd) callbacks.onEnd();
    return () => {};
  }

  // Clear any existing heartbeat timer
  if (speechHeartbeatTimer) {
    clearInterval(speechHeartbeatTimer);
    speechHeartbeatTimer = null;
  }

  // Immediately cancel any leftover utterances
  try {
    window.speechSynthesis.cancel();
  } catch {
    // ignore
  }

  // If user muted voice greetings, return early
  if (isVoiceMuted()) {
    if (callbacks?.onEnd) callbacks.onEnd();
    return () => {};
  }

  try {
    const utterance = new SpeechSynthesisUtterance(text);
    activeUtterance = utterance; // Prevent garbage collection in Chrome

    const voice = selectBestNaturalVoice();
    if (voice) {
      utterance.voice = voice;
      utterance.lang = voice.lang || 'en-US';
    } else {
      utterance.lang = 'en-US';
    }

    // Diplomatic cadence: slightly relaxed, articulate, calm pitch
    utterance.rate = 0.94;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;

    let hasEnded = false;

    utterance.onstart = () => {
      callbacks?.onStart?.();

      // Chrome SpeechSynthesis watchdog: prevents long utterance pause bug
      speechHeartbeatTimer = setInterval(() => {
        if (!hasEnded && window.speechSynthesis.speaking) {
          window.speechSynthesis.pause();
          window.speechSynthesis.resume();
        }
      }, 5000);
    };

    utterance.onend = () => {
      hasEnded = true;
      if (speechHeartbeatTimer) {
        clearInterval(speechHeartbeatTimer);
        speechHeartbeatTimer = null;
      }
      activeUtterance = null;
      callbacks?.onEnd?.();
    };

    utterance.onerror = (e) => {
      hasEnded = true;
      if (speechHeartbeatTimer) {
        clearInterval(speechHeartbeatTimer);
        speechHeartbeatTimer = null;
      }
      activeUtterance = null;
      console.warn('Speech synthesis event:', e);
      callbacks?.onError?.(e);
      callbacks?.onEnd?.();
    };

    // If voices list is async and empty, wait for onvoiceschanged
    if (window.speechSynthesis.getVoices().length === 0) {
      const voicesChangedHandler = () => {
        window.speechSynthesis.onvoiceschanged = null;
        const v = selectBestNaturalVoice();
        if (v) utterance.voice = v;
        try {
          window.speechSynthesis.speak(utterance);
        } catch {
          callbacks?.onEnd?.();
        }
      };
      window.speechSynthesis.onvoiceschanged = voicesChangedHandler;
    } else {
      window.speechSynthesis.speak(utterance);
    }

    return () => {
      hasEnded = true;
      if (speechHeartbeatTimer) {
        clearInterval(speechHeartbeatTimer);
        speechHeartbeatTimer = null;
      }
      activeUtterance = null;
      try {
        window.speechSynthesis.cancel();
      } catch {
        // ignore
      }
    };
  } catch (err) {
    console.warn('Speech synthesis failed to execute:', err);
    callbacks?.onEnd?.();
    return () => {};
  }
}
