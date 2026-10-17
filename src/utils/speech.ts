/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Speech synthesis is completely removed per specification:
 * "Remove all AI-generated voices. Remove all Mozart voices. Remove all automatic speech. Do not use the Web Speech API."
 */

export const isVoiceMuted = true;

export function setVoiceMuted(_muted: boolean): void {
  // Speech disabled
}

export function getTimeOfDayGreeting(name = 'Ahmed Magdi'): { salutation: string; fullGreeting: string } {
  const currentHour = new Date().getHours();
  let salutation = 'Good morning';

  if (currentHour >= 12 && currentHour < 17) {
    salutation = 'Good afternoon';
  } else if (currentHour >= 17 || currentHour < 4) {
    salutation = 'Good evening';
  }

  return {
    salutation,
    fullGreeting: `Welcome back, ${name}. ${salutation}. Diplomatic clearance verified.`,
  };
}

export function speakNaturalGreeting(
  _text: string,
  options?: { onStart?: () => void; onEnd?: () => void; onError?: (e: unknown) => void }
): () => void {
  // Web Speech API is strictly removed.
  if (options?.onEnd) {
    setTimeout(() => {
      options.onEnd?.();
    }, 100);
  }
  return () => {};
}
