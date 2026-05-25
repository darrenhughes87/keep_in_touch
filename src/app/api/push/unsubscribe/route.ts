import { NextResponse } from 'next/server';
import { requireSession } from '@/lib/auth';
import { getDb } from '@/lib/db';

export async function POST(req: Request) {
  await requireSession();
  const { endpoint } = await req.json();
  if (!endpoint) return NextResponse.json({ error: 'endpoint required' }, { status: 400 });
  getDb().prepare('DELETE FROM push_subscriptions WHERE endpoint = ?').run(endpoint);
  return NextResponse.json({ ok: true });
}
