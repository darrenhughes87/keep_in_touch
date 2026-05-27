import { NextResponse } from 'next/server';
import { requireSession } from '@/lib/auth';
import { scheduleFollowUp, clearFollowUp } from '@/lib/queries';

// Set a follow-up. Body: { until: ISO datetime string }
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  await requireSession();
  const { id } = await params;
  const { until } = await req.json();
  if (!until || typeof until !== 'string') {
    return NextResponse.json({ error: 'until (ISO datetime) required' }, { status: 400 });
  }
  scheduleFollowUp(parseInt(id, 10), until);
  return NextResponse.json({ ok: true });
}

// Clear an existing follow-up.
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  await requireSession();
  const { id } = await params;
  clearFollowUp(parseInt(id, 10));
  return NextResponse.json({ ok: true });
}
