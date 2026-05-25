import { NextResponse } from 'next/server';
import { requireSession } from '@/lib/auth';
import { setStar, confirmStar } from '@/lib/queries';

// Toggle star on/off. body: { starred: boolean }
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  await requireSession();
  const { id } = await params;
  const { starred } = await req.json();
  setStar(parseInt(id, 10), !!starred);
  return NextResponse.json({ ok: true });
}

// Refresh the 30-day check-in timestamp (user said "yes, still in touch").
export async function PATCH(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  await requireSession();
  const { id } = await params;
  confirmStar(parseInt(id, 10));
  return NextResponse.json({ ok: true });
}
