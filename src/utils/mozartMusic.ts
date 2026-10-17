/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Music synthesis is strictly removed per specification:
 * "No audio should play anywhere in the application."
 */

export function playMozartWelcomeMusic(_volume = 0.2): {
  fadeOut: (durationMs?: number) => void;
  stop: () => void;
} {
  return {
    fadeOut: () => {},
    stop: () => {},
  };
}
