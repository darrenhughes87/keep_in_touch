import { NextResponse } from 'next/server';
import { requireSession } from '@/lib/auth';
import { logInteraction, markSuggestionActed } from '@/lib/queries';
import { todayIso } from '@/lib/time';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  await requireSession();
  const { id } = await params;
  const pid = parseInt(id, 10);
  const { channel, origin } = await req.json();
  const i = logInteraction(pid, channel, origin ?? 'button_tap');
  markSuggestionActed(pid, todayIso());
  return NextResponse.json(i, { status: 201 });
}
