// Normalise UK-style / unprefixed phone numbers using a configured
// default country code. WhatsApp's wa.me link requires the full
// international number, no leading zeros, no spaces.

export function normalisePhone(raw: string | null | undefined, defaultCountryCode: string): string {
  if (!raw) return '';
  let s = raw.replace(/[^\d+]/g, '');
  if (!s) return '';

  const cc = defaultCountryCode.replace(/[^\d]/g, '');

  // Already in international format: + prefix or 00 prefix.
  // Strip the prefix and trust the rest. Also handle the "+CC (0) NNN..."
  // UK convention where people write "+44 (0) 7700 ..." with both the
  // country code AND the national trunk 0 — strip that extra 0.
  if (s.startsWith('+') || s.startsWith('00')) {
    s = s.startsWith('+') ? s.slice(1) : s.slice(2);
    if (cc && s.startsWith(cc + '0')) {
      return cc + s.slice(cc.length + 1);
    }
    return s;
  }

  // No international prefix. Use the configured country code, if any.
  if (cc) {
    if (s.startsWith(cc + '0')) return cc + s.slice(cc.length + 1); // "44 0 7700..."
    if (s.startsWith(cc))       return s;                            // already correct
    if (s.startsWith('0'))      return cc + s.slice(1);              // national format
    return cc + s;                                                   // bare subscriber number
  }

  return s;
}
