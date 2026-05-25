import { NextResponse } from 'next/server';
import { requireSession } from '@/lib/auth';
import { archivePerson, restorePerson } from '@/lib/queries';

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  await requireSession();
  const { id } = await params;
  archivePerson(parseInt(id, 10));
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  await requireSession();
  const { id } = await params;
  restorePerson(parseInt(id, 10));
  return NextResponse.json({ ok: true });
}
