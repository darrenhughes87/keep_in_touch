// Sends one soft morning push per registered subscription, IF there are
// people surfaced today. Silent on empty days. Called by kit-cron at the
// configured digest time.

import { NextResponse } from 'next/server';
import { getOrComputeSuggestions } from '@/lib/queries';
import { sendToAll } from '@/lib/push';

export async function POST(req: Request) {
  const auth = req.headers.get('authorization');
  const expected = `Bearer ${process.env.CRON_SECRET}`;
  if (!process.env.CRON_SECRET || auth !== expected) {
    return NextResponse.json({ error: 'unauthorised' }, { status: 401 });
  }

  const suggestions = getOrComputeSuggestions();
  if (suggestions.length === 0) {
    return NextResponse.json({ sent: 0, reason: 'empty day, no push' });
  }

  const body = suggestions.length === 1
    ? 'One name today, if you have a spare minute.'
    : `${suggestions.length} people, if you have a spare ten minutes.`;

  const result = await sendToAll({ title: 'Keep In Touch', body, tag: 'kit-daily' });
  return NextResponse.json(result);
}
