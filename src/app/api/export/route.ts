import { NextResponse } from 'next/server';
import { requireSession } from '@/lib/auth';
import { getDb } from '@/lib/db';

export async function GET() {
  await requireSession();
  const db = getDb();
  const dump = {
    exported_at: new Date().toISOString(),
    version: 1,
    settings: db.prepare('SELECT * FROM settings WHERE id = 1').get(),
    people: db.prepare('SELECT * FROM people').all(),
    notes: db.prepare('SELECT * FROM notes').all(),
    interactions: db.prepare('SELECT * FROM interactions').all(),
    moments: db.prepare('SELECT * FROM moments').all(),
  };
  return new NextResponse(JSON.stringify(dump, null, 2), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Content-Disposition': `attachment; filename="keepintouch-${new Date().toISOString().slice(0,10)}.json"`,
    },
  });
}
