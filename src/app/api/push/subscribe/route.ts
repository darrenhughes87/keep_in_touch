import { NextResponse } from 'next/server';
import { requireSession } from '@/lib/auth';
import { getDb } from '@/lib/db';

export async function POST(req: Request) {
  await requireSession();
  const sub = await req.json();
  if (!sub?.endpoint || !sub?.keys?.p256dh || !sub?.keys?.auth) {
    return NextResponse.json({ error: 'invalid subscription' }, { status: 400 });
  }
  getDb().prepare(`
    INSERT OR IGNORE INTO push_subscriptions (endpoint, p256dh, auth)
    VALUES (?, ?, ?)
  `).run(sub.endpoint, sub.keys.p256dh, sub.keys.auth);
  return NextResponse.json({ ok: true });
}
