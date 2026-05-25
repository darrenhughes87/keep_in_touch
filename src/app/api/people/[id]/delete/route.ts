// Hard delete a person and everything attached (notes, interactions,
// suggestions, photo file). Different from archive — this is unrecoverable.

import { NextResponse } from 'next/server';
import { requireSession } from '@/lib/auth';
import { getPerson } from '@/lib/queries';
import { getDb, photosDir } from '@/lib/db';
import { unlink } from 'node:fs/promises';
import path from 'node:path';

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  await requireSession();
  const { id } = await params;
  const pid = parseInt(id, 10);
  const p = getPerson(pid);
  if (!p) return NextResponse.json({ error: 'not found' }, { status: 404 });

  if (p.photo_path) {
    try { await unlink(path.join(photosDir(), p.photo_path)); } catch {}
  }
  // ON DELETE CASCADE on notes / interactions / suggestions handles the rest.
  getDb().prepare('DELETE FROM people WHERE id = ?').run(pid);
  return NextResponse.json({ ok: true });
}
