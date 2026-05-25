import { NextResponse } from 'next/server';
import { requireSession } from '@/lib/auth';
import { listPeople, createPerson } from '@/lib/queries';

export async function GET() {
  await requireSession();
  return NextResponse.json(listPeople());
}

export async function POST(req: Request) {
  await requireSession();
  const body = await req.json();
  const p = createPerson(body);
  return NextResponse.json(p, { status: 201 });
}
