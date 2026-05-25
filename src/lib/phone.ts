// Normalise UK-style / unprefixed phone numbers using a configured
// default country code. WhatsApp's wa.me link requires the full
// international number, no leading zeros, no spaces.

export function normalisePhone(raw: string | null | undefined, defaultCountryCode: string): string {
  if (!raw) return '';
  let s = raw.replace(/[^\d+]/g, '');
  if (!s) return '';

  // Already has a + prefix → take as-is, strip the +
  if (s.startsWith('+')) return s.slice(1);

  // 00-prefixed international (e.g. "00447700...") → strip the 00
  if (s.startsWith('00')) return s.slice(2);

  // Leading 0 + default country code → replace 0 with country code
  // (e.g. "07700..." + "+44" → "447700...")
  const cc = defaultCountryCode.replace(/[^\d]/g, '');
  if (cc && s.startsWith('0')) return cc + s.slice(1);

  // Already starts with the country code digits → take as-is
  if (cc && s.startsWith(cc)) return s;

  // Fallback: prepend country code if set
  if (cc) return cc + s;

  return s;
}
