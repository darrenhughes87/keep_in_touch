import { NextResponse } from 'next/server';
import { requireSession } from '@/lib/auth';
import { getPerson, updatePerson, archivePerson } from '@/lib/queries';

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  await requireSession();
  const { id } = await params;
  const p = getPerson(parseInt(id, 10));
  if (!p) return NextResponse.json({ error: 'not found' }, { status: 404 });
  return NextResponse.json(p);
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  await requireSession();
  const { id } = await params;
  const body = await req.json();
  const p = updatePerson(parseInt(id, 10), body);
  return NextResponse.json(p);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  await requireSession();
  const { id } = await params;
  archivePerson(parseInt(id, 10));
  return NextResponse.json({ ok: true });
}
