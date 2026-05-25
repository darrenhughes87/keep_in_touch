import { NextResponse } from 'next/server';
import { requireSession } from '@/lib/auth';
import { getPerson, updatePerson } from '@/lib/queries';
import { photosDir } from '@/lib/db';
import { writeFile, unlink } from 'node:fs/promises';
import path from 'node:path';

const MAX_BYTES = 8 * 1024 * 1024; // 8MB

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  await requireSession();
  const { id } = await params;
  const pid = parseInt(id, 10);
  const p = getPerson(pid);
  if (!p) return NextResponse.json({ error: 'not found' }, { status: 404 });

  const form = await req.formData();
  const file = form.get('photo');
  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'no file' }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: 'too large (max 8MB)' }, { status: 413 });
  }
  if (!file.type.startsWith('image/')) {
    return NextResponse.json({ error: 'not an image' }, { status: 415 });
  }

  const buf = Buffer.from(await file.arrayBuffer());
  const filename = `${pid}.jpg`;
  await writeFile(path.join(photosDir(), filename), buf);
  updatePerson(pid, { photo_path: filename });
  return NextResponse.json({ ok: true, photo_path: filename });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  await requireSession();
  const { id } = await params;
  const pid = parseInt(id, 10);
  const p = getPerson(pid);
  if (!p?.photo_path) return NextResponse.json({ ok: true });
  try { await unlink(path.join(photosDir(), p.photo_path)); } catch {}
  updatePerson(pid, { photo_path: null as any });
  return NextResponse.json({ ok: true });
}
