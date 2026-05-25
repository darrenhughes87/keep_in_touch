import { NextResponse } from 'next/server';
import { requireSession } from '@/lib/auth';
import { createPerson, defaultCadenceFor } from '@/lib/queries';
import type { Layer } from '@/lib/types';

export async function POST(req: Request) {
  await requireSession();
  const { contacts } = await req.json() as {
    contacts: Array<{ name: string; phone?: string; email?: string; birthday?: string; layer: Layer }>;
  };
  let added = 0;
  for (const c of contacts) {
    createPerson({
      name: c.name,
      layer: c.layer,
      phone: c.phone ?? null,
      whatsapp_phone: c.phone ?? null,
      email: c.email ?? null,
      birthday: c.birthday ?? null,
      cadence_days: defaultCadenceFor(c.layer),
    });
    added++;
  }
  return NextResponse.json({ added });
}
