/**
 * Privacy-preserving customer review helpers.
 * - Normalizes Pakistani & international mobile numbers to digits.
 * - Masks phone numbers so ONLY the last 4 digits are ever saved or displayed (e.g. "••••••4567").
 * - Derives deterministic, salted SHA-256 ID and ownership proof hashes so customers can
 *   edit their own review anytime using their mobile number without exposing full numbers publicly.
 */

const MY_REVIEWS_STORAGE_KEY = 'usman_mobile_my_review_ids_v1';

export function normalizePhoneDigits(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  // Normalize Pakistani 923xx... or 03xx... to canonical 10-digit subscriber tail (e.g. 3001234567)
  if (digits.startsWith('92') && digits.length >= 12) {
    return digits.slice(-10);
  }
  if (digits.startsWith('0') && digits.length >= 11) {
    return digits.slice(-10);
  }
  return digits;
}

export function isValidPhoneInput(raw: string): boolean {
  const digits = raw.replace(/\D/g, '');
  return digits.length >= 10 && digits.length <= 15;
}

/**
 * Returns strictly last 4 digits visible, e.g. "••••••8225".
 */
export function maskPhoneLast4(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  if (digits.length < 4) return '••••';
  const last4 = digits.slice(-4);
  return `••••••${last4}`;
}

function fallbackHashHex(input: string): string {
  let h1 = 0xdeadbeef ^ input.length;
  let h2 = 0x41c6ce57 ^ input.length;
  for (let i = 0; i < input.length; i++) {
    const ch = input.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  const p1 = (h1 >>> 0).toString(16).padStart(8, '0');
  const p2 = (h2 >>> 0).toString(16).padStart(8, '0');
  return `${p1}${p2}${p2}${p1}`;
}

async function sha256Hex(message: string): Promise<string> {
  try {
    if (typeof crypto !== 'undefined' && crypto.subtle) {
      const data = new TextEncoder().encode(message);
      const digest = await crypto.subtle.digest('SHA-256', data);
      return Array.from(new Uint8Array(digest))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');
    }
  } catch {
    // Fallback below
  }
  return fallbackHashHex(message);
}

export async function deriveReviewCredentials(rawPhone: string): Promise<{
  reviewId: string;
  phoneHash: string;
  maskedPhone: string;
}> {
  const normalized = normalizePhoneDigits(rawPhone);
  const idDigest = await sha256Hex(`umr_review_id_v1:${normalized}`);
  const secretDigest = await sha256Hex(`umr_review_secret_v1:${normalized}`);
  return {
    reviewId: `rev_${idDigest.slice(0, 20)}`,
    phoneHash: secretDigest.slice(0, 48),
    maskedPhone: maskPhoneLast4(rawPhone),
  };
}

export function loadMySavedReviewIds(): string[] {
  try {
    const raw = localStorage.getItem(MY_REVIEWS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === 'string') : [];
  } catch {
    return [];
  }
}

export function rememberMyReviewId(reviewId: string): void {
  try {
    const existing = loadMySavedReviewIds();
    if (!existing.includes(reviewId)) {
      localStorage.setItem(MY_REVIEWS_STORAGE_KEY, JSON.stringify([reviewId, ...existing].slice(0, 10)));
    }
  } catch {
    // Ignore storage issues
  }
}
