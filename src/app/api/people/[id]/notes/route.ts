import { NextResponse } from 'next/server';
import { requireSession } from '@/lib/auth';
import { createNote, listNotes } from '@/lib/queries';

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  await requireSession();
  const { id } = await params;
  return NextResponse.json(listNotes(parseInt(id, 10)));
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  await requireSession();
  const { id } = await params;
  const { body, source } = await req.json();
  if (!body || typeof body !== 'string') {
    return NextResponse.json({ error: 'body required' }, { status: 400 });
  }
  const n = createNote(parseInt(id, 10), body.trim(), source === 'voice' ? 'voice' : 'text');
  return NextResponse.json(n, { status: 201 });
}
