import { NextResponse } from 'next/server';
import { computeSuggestionsFor } from '@/lib/queries';
import { todayIso } from '@/lib/time';

export async function POST(req: Request) {
  const auth = req.headers.get('authorization');
  const expected = `Bearer ${process.env.CRON_SECRET}`;
  if (!process.env.CRON_SECRET || auth !== expected) {
    return NextResponse.json({ error: 'unauthorised' }, { status: 401 });
  }
  const out = computeSuggestionsFor(todayIso());
  return NextResponse.json({ count: out.length });
}
