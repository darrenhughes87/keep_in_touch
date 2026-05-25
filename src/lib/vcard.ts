// Minimal vCard 3.0 / 4.0 parser. Handles common Apple / Google exports.
// Pulls FN, N, TEL (cell preferred), EMAIL, BDAY.

export interface ParsedContact {
  name: string;
  phone?: string;
  email?: string;
  birthday?: string;
}

export function parseVcard(text: string): ParsedContact[] {
  const cards = text.split(/BEGIN:VCARD/i).slice(1);
  const out: ParsedContact[] = [];
  for (const raw of cards) {
    const body = raw.split(/END:VCARD/i)[0];
    const lines = unfold(body).split(/\r?\n/);

    let name = '';
    let phones: { tel: string; pref: boolean; cell: boolean }[] = [];
    let email = '';
    let birthday = '';

    for (const line of lines) {
      if (!line.trim()) continue;
      const colon = line.indexOf(':');
      if (colon < 0) continue;
      const left = line.slice(0, colon);
      const value = line.slice(colon + 1).trim();
      const [prop, ...paramParts] = left.split(';');
      const params = paramParts.map(p => p.toUpperCase());
      const upper = prop.toUpperCase();

      if (upper === 'FN') name = decode(value);
      else if (upper === 'N' && !name) {
        const parts = value.split(';');
        name = decode([parts[1] ?? '', parts[0] ?? ''].filter(Boolean).join(' ').trim());
      }
      else if (upper === 'TEL') {
        phones.push({
          tel: cleanPhone(value),
          pref: params.some(p => p.includes('PREF')),
          cell: params.some(p => p.includes('CELL') || p.includes('MOBILE')),
        });
      }
      else if (upper === 'EMAIL' && !email) email = decode(value);
      else if (upper === 'BDAY' && !birthday) birthday = normaliseBday(value);
    }

    // pick best phone: cell+pref > cell > pref > first
    let phone: string | undefined;
    if (phones.length) {
      const cellPref = phones.find(p => p.cell && p.pref);
      const cell = phones.find(p => p.cell);
      const pref = phones.find(p => p.pref);
      phone = (cellPref ?? cell ?? pref ?? phones[0]).tel;
    }

    if (name) out.push({ name, phone, email: email || undefined, birthday: birthday || undefined });
  }
  return out;
}

function unfold(s: string): string {
  // vCard line folding: continuation lines begin with whitespace
  return s.replace(/\r?\n[ \t]/g, '');
}

function decode(s: string): string {
  return s
    .replace(/\\,/g, ',')
    .replace(/\\;/g, ';')
    .replace(/\\n/gi, ' ')
    .replace(/\\\\/g, '\\')
    .trim();
}

function cleanPhone(s: string): string {
  return s.replace(/[^\d+]/g, '');
}

function normaliseBday(s: string): string {
  // 19850214 → 1985-02-14, 1985-02-14 → as is, --0214 → 02-14
  if (/^\d{8}$/.test(s)) return `${s.slice(0,4)}-${s.slice(4,6)}-${s.slice(6,8)}`;
  if (/^--\d{4}$/.test(s)) return `${s.slice(2,4)}-${s.slice(4,6)}`;
  return s;
}
