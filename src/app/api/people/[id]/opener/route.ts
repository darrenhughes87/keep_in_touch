import { NextResponse } from 'next/server';
import { requireSession } from '@/lib/auth';
import { getPerson, latestNote } from '@/lib/queries';
import { suggestOpener } from '@/lib/anthropic';

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  await requireSession();
  const { id } = await params;
  const p = getPerson(parseInt(id, 10));
  if (!p) return NextResponse.json({ error: 'not found' }, { status: 404 });
  const ln = latestNote(p.id);
  const ageDays = ln ? Math.floor((Date.now() - new Date(ln.created_at).getTime()) / 86_400_000) : null;
  try {
    const opener = await suggestOpener(p.name, ln?.body ?? null, ageDays);
    return NextResponse.json({ opener });
  } catch (err: any) {
    return NextResponse.json({ opener: `Drop ${p.name.split(' ')[0]} a line and ask how things are.` });
  }
}
