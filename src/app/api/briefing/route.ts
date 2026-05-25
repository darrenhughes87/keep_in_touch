import { NextResponse } from 'next/server';
import { requireSession } from '@/lib/auth';
import { getOrComputeSuggestions, getPerson, latestNote, lastContact, birthdaysSoon, getSettings } from '@/lib/queries';
import { briefingScript } from '@/lib/anthropic';
import { todayIso } from '@/lib/time';

export async function GET() {
  await requireSession();
  const settings = getSettings();
  const suggestions = getOrComputeSuggestions();
  const items = suggestions.map(s => {
    const p = getPerson(s.person_id);
    if (!p) return null;
    const lc = lastContact(s.person_id);
    const ds = lc ? Math.floor((Date.now() - new Date(lc).getTime()) / 86_400_000) : null;
    const ln = latestNote(s.person_id);
    return {
      name: p.name.split(' ')[0],
      days_since: ds,
      cadence: p.cadence_days,
      latest_note: ln?.body ?? null,
      layer: p.layer,
    };
  }).filter(Boolean) as any[];

  const bdays = birthdaysSoon(7).map(b => {
    const parts = (b.birthday ?? '').split('-');
    const month = parseInt(parts.length === 3 ? parts[1] : parts[0], 10);
    const day = parseInt(parts.length === 3 ? parts[2] : parts[1], 10);
    const now = new Date();
    let next = new Date(now.getFullYear(), month - 1, day);
    if (next.getTime() < new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()) {
      next = new Date(now.getFullYear() + 1, month - 1, day);
    }
    const d = Math.ceil((next.getTime() - Date.now()) / 86_400_000);
    return { name: b.name.split(' ')[0], days_until: d };
  });

  const script = await briefingScript({
    date: todayIso(),
    greeting_tone: settings.greeting_tone,
    suggestions: items,
    birthdays: bdays,
  });
  return NextResponse.json({ script });
}
