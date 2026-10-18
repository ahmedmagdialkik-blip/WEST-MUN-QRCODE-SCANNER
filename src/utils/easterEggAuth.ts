/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Easter Egg Account Verification
 * Exclusively triggers for "Dana Alnajar" (case-insensitive, ignoring extra whitespace).
 */

export function isDanaAlnajar(name?: string | null): boolean {
  if (!name) return false;
  // Case-insensitive, strip all internal and surrounding whitespace
  const sanitized = name.toLowerCase().replace(/\s+/g, '');
  return sanitized === 'danaalnajar';
}
