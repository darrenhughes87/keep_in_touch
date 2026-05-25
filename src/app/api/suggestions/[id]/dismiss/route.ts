import { NextResponse } from 'next/server';
import { requireSession } from '@/lib/auth';
import { dismissSuggestion } from '@/lib/queries';

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  await requireSession();
  const { id } = await params;
  dismissSuggestion(parseInt(id, 10));
  return NextResponse.json({ ok: true });
}
