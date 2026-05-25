import { NextResponse } from 'next/server';
import { requireSession } from '@/lib/auth';
import { createPerson, updateSettings, defaultCadenceFor } from '@/lib/queries';
import type { Layer } from '@/lib/types';

export async function POST(req: Request) {
  await requireSession();
  const { people } = await req.json() as { people: Array<{ name: string; layer: Layer; phone?: string | null }> };
  for (const p of people) {
    createPerson({
      name: p.name,
      layer: p.layer,
      phone: p.phone || null,
      whatsapp_phone: p.phone || null,
      cadence_days: defaultCadenceFor(p.layer),
    });
  }
  updateSettings({ onboarded: 1 });
  return NextResponse.json({ ok: true });
}
