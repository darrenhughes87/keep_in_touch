import { NextResponse } from 'next/server';
import { requireSession } from '@/lib/auth';
import { cleanDictation, haveAnthropicKey } from '@/lib/anthropic';

export async function POST(req: Request) {
  await requireSession();
  if (!haveAnthropicKey()) {
    return NextResponse.json({ error: 'Anthropic key not configured', cleaned: null }, { status: 503 });
  }
  const { body } = await req.json();
  if (!body || typeof body !== 'string' || !body.trim()) {
    return NextResponse.json({ cleaned: '' });
  }
  try {
    const cleaned = await cleanDictation(body);
    return NextResponse.json({ cleaned });
  } catch (err: any) {
    console.error('[clean-note] failed', err?.message);
    return NextResponse.json({ cleaned: body, error: 'cleanup failed, original returned' });
  }
}

export async function GET() {
  await requireSession();
  return NextResponse.json({ available: haveAnthropicKey() });
}
