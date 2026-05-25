// Sends one soft morning push per registered subscription, IF there are
// people surfaced today. Silent on empty days. Called by kit-cron at the
// configured digest time.
//
// Append ?test=1 to bypass the empty-day check and fire a sanity-test push
// regardless. Useful for verifying the pipeline without waiting until 08:30.

import { NextResponse } from 'next/server';
import { getOrComputeSuggestions } from '@/lib/queries';
import { sendToAll } from '@/lib/push';

export async function POST(req: Request) {
  const auth = req.headers.get('authorization');
  const expected = `Bearer ${process.env.CRON_SECRET}`;
  if (!process.env.CRON_SECRET || auth !== expected) {
    return NextResponse.json({ error: 'unauthorised' }, { status: 401 });
  }

  const url = new URL(req.url);
  const isTest = url.searchParams.get('test') === '1';

  const suggestions = getOrComputeSuggestions();
  if (suggestions.length === 0 && !isTest) {
    return NextResponse.json({ sent: 0, reason: 'empty day, no push' });
  }

  const body = isTest
    ? 'Test push from Keep In Touch. If you see this, everything works.'
    : suggestions.length === 1
      ? 'One name today, if you have a spare minute.'
      : `${suggestions.length} people, if you have a spare ten minutes.`;

  const result = await sendToAll({ title: 'Keep In Touch', body, tag: isTest ? 'kit-test' : 'kit-daily' });
  return NextResponse.json(result);
}
