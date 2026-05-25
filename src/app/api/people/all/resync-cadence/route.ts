// One-shot: snap a person's cadence_days back to the user's configured
// default for their current layer. Used after Settings cadence defaults
// change, or to fix legacy people whose cadence was stamped at an old default.

import { NextResponse } from 'next/server';
import { requireSession } from '@/lib/auth';
import { getDb } from '@/lib/db';
import { defaultCadenceFor } from '@/lib/queries';
import type { Person } from '@/lib/types';

export async function POST() {
  await requireSession();
  const db = getDb();
  const ppl = db.prepare('SELECT id, layer FROM people').all() as Pick<Person, 'id' | 'layer'>[];
  const upd = db.prepare('UPDATE people SET cadence_days = ? WHERE id = ?');
  let touched = 0;
  for (const p of ppl) {
    upd.run(defaultCadenceFor(p.layer), p.id);
    touched++;
  }
  return NextResponse.json({ touched });
}
