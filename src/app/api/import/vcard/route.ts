import { NextResponse } from 'next/server';
import { requireSession } from '@/lib/auth';
import { parseVcard } from '@/lib/vcard';

export async function POST(req: Request) {
  await requireSession();
  const text = await req.text();
  const contacts = parseVcard(text);
  return NextResponse.json({ contacts });
}
