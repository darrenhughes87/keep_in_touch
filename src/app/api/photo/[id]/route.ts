import { NextResponse } from 'next/server';
import { requireSession } from '@/lib/auth';
import { getPerson } from '@/lib/queries';
import { photosDir } from '@/lib/db';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  await requireSession();
  const { id } = await params;
  const p = getPerson(parseInt(id, 10));
  if (!p || !p.photo_path) return new NextResponse(null, { status: 404 });
  try {
    const buf = await readFile(path.join(photosDir(), p.photo_path));
    return new NextResponse(buf, {
      headers: { 'Content-Type': 'image/jpeg', 'Cache-Control': 'private, max-age=86400' },
    });
  } catch {
    return new NextResponse(null, { status: 404 });
  }
}
