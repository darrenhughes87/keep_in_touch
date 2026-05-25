import { NextResponse } from 'next/server';
import { requireSession } from '@/lib/auth';
import { snoozePerson } from '@/lib/queries';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  await requireSession();
  const { id } = await params;
  const { until } = await req.json();
  snoozePerson(parseInt(id, 10), until);
  return NextResponse.json({ ok: true });
}
