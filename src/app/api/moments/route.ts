import { NextResponse } from 'next/server';
import { requireSession } from '@/lib/auth';
import { createMoment, listMoments } from '@/lib/queries';

export async function GET(req: Request) {
  await requireSession();
  const { searchParams } = new URL(req.url);
  const year = searchParams.get('year');
  return NextResponse.json(listMoments(year ? parseInt(year, 10) : undefined));
}

export async function POST(req: Request) {
  await requireSession();
  const { body, source } = await req.json();
  if (!body) return NextResponse.json({ error: 'body required' }, { status: 400 });
  const m = createMoment(body.trim(), source === 'voice' ? 'voice' : 'text');
  return NextResponse.json(m, { status: 201 });
}
