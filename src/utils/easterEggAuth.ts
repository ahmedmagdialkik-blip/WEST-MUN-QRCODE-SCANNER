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
 * Check if the user is strictly Dana Al Najjar (case-insensitive, ignoring extra spaces).
 * Used exclusively for the special "See, Freshman... I changed your name!" easter egg.
 */
export function isDanaAlNajjar(name?: string | null): boolean {
  const normalized = normalizeUserName(name);
  return (
    normalized === 'dana al najjar' ||
    normalized === 'dana alnajjar' ||
    normalized === 'dana al-najjar' ||
    normalized === 'dana alnajar'
  );
}

// Backward compatibility alias
export const isDanaAlnajar = isDanaAlNajjar;

/**
 * Determines which account-specific welcome animation to trigger.
 * 
 * Freshman Welcome Animation Users:
 * - Dana Al Najjar (or Dana)
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
    'dana al najjar',
    'dana alnajjar',
    'dana al-najjar',
    'dana alnajar',
    'dana',
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
  const usgNames = ['zain firas', 'zain', 'under secretary-general', 'under secretary general'];
  if (usgNames.includes(normalized)) {
    return 'under_secretary';
  }

  return null;
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
