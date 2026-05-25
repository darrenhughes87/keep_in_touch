import { NextResponse } from 'next/server';
import { requireSession } from '@/lib/auth';
import { vapidPublicKey } from '@/lib/push';

export async function GET() {
  await requireSession();
  const key = vapidPublicKey();
  if (!key) return NextResponse.json({ key: null, available: false });
  return NextResponse.json({ key, available: true });
}
