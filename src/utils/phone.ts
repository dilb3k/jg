/**
 * Uzbek phone-number formatting helpers.
 *
 * Canonical display format: "+998 90 123 45 67"  (+xxx xx xxx xx xx)
 * The input always keeps a leading "+998" so the user only types the 9
 * subscriber digits.
 */

export const PHONE_PREFIX = "+998";

/** Total digits in a complete number: 998 + 9 subscriber digits. */
export const PHONE_FULL_DIGITS = 12;

/** Format raw input into "+998 90 123 45 67", capped at a full number. */
export const formatPhone = (text: string): string => {
  const digits = text.replace(/\D/g, "").slice(0, PHONE_FULL_DIGITS);
  if (digits.length === 0) return PHONE_PREFIX;
  let r = "+" + digits.slice(0, 3);
  if (digits.length > 3) r += " " + digits.slice(3, 5);
  if (digits.length > 5) r += " " + digits.slice(5, 8);
  if (digits.length > 8) r += " " + digits.slice(8, 10);
  if (digits.length > 10) r += " " + digits.slice(10, 12);
  return r;
};

/** Format an already-stored phone for display; passes through unknown shapes. */
export const displayPhone = (phone: string): string => {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 0) return phone;
  return formatPhone(digits);
};

/** Digit count of a phone string (e.g. to validate completeness). */
export const phoneDigitCount = (phone: string): number =>
  phone.replace(/\D/g, "").length;

/** True when the number has all 12 digits (+998 + 9). */
export const isCompletePhone = (phone: string): boolean =>
  phoneDigitCount(phone) >= PHONE_FULL_DIGITS;
