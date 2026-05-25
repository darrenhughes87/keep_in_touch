import { NextResponse } from 'next/server';
import { requireSession } from '@/lib/auth';
import { deleteNote, updateNote } from '@/lib/queries';

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  await requireSession();
  const { id } = await params;
  deleteNote(parseInt(id, 10));
  return NextResponse.json({ ok: true });
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  await requireSession();
  const { id } = await params;
  const { body } = await req.json();
  updateNote(parseInt(id, 10), body);
  return NextResponse.json({ ok: true });
}
