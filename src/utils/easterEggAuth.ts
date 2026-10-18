/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Account-Specific Easter Egg Authentication & Matcher
 * Strictly activates ONLY for designated individuals (case-insensitive, ignoring extra spaces).
 * Every other user experiences the standard login process with no additional animations or sounds.
 */

export type AccountEasterEggType = 'freshman' | 'under_secretary' | null;

/**
 * Normalizes a user name by trimming leading/trailing spaces,
 * converting to lowercase, and collapsing multiple internal spaces to a single space.
 */
export function normalizeUserName(name?: string | null): string {
  if (!name) return '';
  return name.trim().toLowerCase().replace(/\s+/g, ' ');
}

/**
 * Determines which account-specific welcome animation to trigger.
 * 
 * Freshman Welcome Animation Users:
 * - Dana Alnajar
 * - Sultana Al Fajar (or Sultana)
 * - Naya (or Naya Barakat)
 * - Jadiya (or Jayda Yasser)
 * - Noor (or Nour)
 * 
 * Under Secretary-General Welcome Animation:
 * - Zain Firas (or Zain)
 */
export function getAccountEasterEgg(name?: string | null): AccountEasterEggType {
  const normalized = normalizeUserName(name);
  if (!normalized) return null;

  // 1. Freshman Welcome Animation Recipients
  const freshmanNames = [
    'dana alnajar',
    'sultana al fajar',
    'sultana',
    'naya',
    'naya barakat',
    'jadiya',
    'jayda yasser',
    'jayda',
    'noor',
    'nour',
  ];

  if (freshmanNames.includes(normalized)) {
    return 'freshman';
  }

  // 2. Under Secretary-General Welcome Animation Recipient
  const usgNames = ['zain firas', 'zain'];
  if (usgNames.includes(normalized)) {
    return 'under_secretary';
  }

  return null;
}

/**
 * Backward compatibility helper for Dana Alnajar specifically
 */
export function isDanaAlnajar(name?: string | null): boolean {
  return normalizeUserName(name) === 'dana alnajar';
}

/**
 * Helper to check if a user qualifies for the Freshman Welcome animation
 */
export function isFreshmanUser(name?: string | null): boolean {
  return getAccountEasterEgg(name) === 'freshman';
}

/**
 * Helper to check if a user qualifies for the Under Secretary-General Welcome animation
 */
export function isUnderSecretaryGeneralUser(name?: string | null): boolean {
  return getAccountEasterEgg(name) === 'under_secretary';
}
