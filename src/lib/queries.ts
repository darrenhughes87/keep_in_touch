import { getDb } from './db';
import type { Person, Note, Interaction, Settings, DailySuggestion, Moment, Layer } from './types';
import { score } from './scoring';
import { todayIso, isQuietDay } from './time';

export function getSettings(): Settings {
  return getDb().prepare('SELECT * FROM settings WHERE id = 1').get() as Settings;
}

export function updateSettings(patch: Partial<Settings>) {
  const cur = getSettings();
  const merged = { ...cur, ...patch };
  getDb().prepare(`
    UPDATE settings SET
      greeting_tone=@greeting_tone,
      digest_time=@digest_time,
      digest_enabled=@digest_enabled,
      max_suggestions_per_day=@max_suggestions_per_day,
      quiet_days=@quiet_days,
      moments_enabled=@moments_enabled,
      cadence_inner=@cadence_inner,
      cadence_close=@cadence_close,
      cadence_good=@cadence_good,
      cadence_acquaintance=@cadence_acquaintance,
      onboarded=@onboarded
    WHERE id = 1
  `).run(merged);
  return getSettings();
}

export function defaultCadenceFor(layer: Layer): number {
  const s = getSettings();
  return s[`cadence_${layer}` as keyof Settings] as number;
}

export function listPeople(opts: { layer?: Layer; archived?: boolean; search?: string } = {}): Person[] {
  let sql = 'SELECT * FROM people WHERE 1=1';
  const params: Record<string, unknown> = {};
  if (!opts.archived) sql += ' AND archived_at IS NULL';
  if (opts.layer) {
    sql += ' AND layer = @layer';
    params.layer = opts.layer;
  }
  if (opts.search) {
    sql += ' AND (name LIKE @q OR nickname LIKE @q)';
    params.q = `%${opts.search}%`;
  }
  sql += ' ORDER BY name COLLATE NOCASE';
  return getDb().prepare(sql).all(params) as Person[];
}

export function getPerson(id: number): Person | undefined {
  return getDb().prepare('SELECT * FROM people WHERE id = ?').get(id) as Person | undefined;
}

export function createPerson(p: Partial<Person> & { name: string; layer: Layer }): Person {
  const cadence = p.cadence_days ?? defaultCadenceFor(p.layer);
  const info = getDb().prepare(`
    INSERT INTO people (name, nickname, layer, cadence_days, phone, whatsapp_phone, email,
                        birthday, birthday_remind, how_we_met, partner_kids, photo_path, notes_facts)
    VALUES (@name, @nickname, @layer, @cadence_days, @phone, @whatsapp_phone, @email,
            @birthday, @birthday_remind, @how_we_met, @partner_kids, @photo_path, @notes_facts)
  `).run({
    name: p.name,
    nickname: p.nickname ?? null,
    layer: p.layer,
    cadence_days: cadence,
    phone: p.phone ?? null,
    whatsapp_phone: p.whatsapp_phone ?? p.phone ?? null,
    email: p.email ?? null,
    birthday: p.birthday ?? null,
    birthday_remind: p.birthday_remind ?? 1,
    how_we_met: p.how_we_met ?? null,
    partner_kids: p.partner_kids ?? null,
    photo_path: p.photo_path ?? null,
    notes_facts: p.notes_facts ?? null,
  });
  return getPerson(info.lastInsertRowid as number)!;
}

export function updatePerson(id: number, patch: Partial<Person>): Person | undefined {
  const cur = getPerson(id);
  if (!cur) return undefined;
  const m = { ...cur, ...patch, id };
  getDb().prepare(`
    UPDATE people SET
      name=@name, nickname=@nickname, layer=@layer, cadence_days=@cadence_days,
      phone=@phone, whatsapp_phone=@whatsapp_phone, email=@email,
      birthday=@birthday, birthday_remind=@birthday_remind,
      how_we_met=@how_we_met, partner_kids=@partner_kids,
      photo_path=@photo_path, notes_facts=@notes_facts,
      snoozed_until=@snoozed_until, archived_at=@archived_at,
      updated_at=datetime('now')
    WHERE id = @id
  `).run(m);
  return getPerson(id);
}

export function archivePerson(id: number) {
  getDb().prepare(`UPDATE people SET archived_at = datetime('now') WHERE id = ?`).run(id);
}

export function restorePerson(id: number) {
  getDb().prepare(`UPDATE people SET archived_at = NULL WHERE id = ?`).run(id);
}

export function snoozePerson(id: number, untilIso: string) {
  getDb().prepare(`UPDATE people SET snoozed_until = ? WHERE id = ?`).run(untilIso, id);
}

// Notes
export function listNotes(personId: number): Note[] {
  return getDb().prepare('SELECT * FROM notes WHERE person_id = ? ORDER BY created_at DESC').all(personId) as Note[];
}

export function latestNote(personId: number): Note | undefined {
  return getDb().prepare('SELECT * FROM notes WHERE person_id = ? ORDER BY created_at DESC LIMIT 1').get(personId) as Note | undefined;
}

export function createNote(personId: number, body: string, source: 'voice' | 'text' = 'text'): Note {
  const info = getDb().prepare('INSERT INTO notes (person_id, body, source) VALUES (?, ?, ?)').run(personId, body, source);
  return getDb().prepare('SELECT * FROM notes WHERE id = ?').get(info.lastInsertRowid) as Note;
}

export function deleteNote(id: number) {
  getDb().prepare('DELETE FROM notes WHERE id = ?').run(id);
}

export function updateNote(id: number, body: string) {
  getDb().prepare('UPDATE notes SET body = ? WHERE id = ?').run(body, id);
}

export function searchNotes(q: string): Array<Note & { person_name: string }> {
  const rows = getDb().prepare(`
    SELECT n.*, p.name as person_name
    FROM notes_fts f
    JOIN notes n ON n.id = f.rowid
    JOIN people p ON p.id = n.person_id
    WHERE notes_fts MATCH ?
    ORDER BY n.created_at DESC
    LIMIT 50
  `).all(q + '*') as Array<Note & { person_name: string }>;
  return rows;
}

// Interactions
export function listInteractions(personId: number, limit = 50): Interaction[] {
  return getDb().prepare('SELECT * FROM interactions WHERE person_id = ? ORDER BY happened_at DESC LIMIT ?').all(personId, limit) as Interaction[];
}

export function logInteraction(
  personId: number,
  channel: Interaction['channel'],
  origin: Interaction['origin'] = 'button_tap',
  direction: 'out' | 'in' = 'out'
): Interaction {
  const info = getDb().prepare(`
    INSERT INTO interactions (person_id, channel, direction, origin)
    VALUES (?, ?, ?, ?)
  `).run(personId, channel, direction, origin);
  return getDb().prepare('SELECT * FROM interactions WHERE id = ?').get(info.lastInsertRowid) as Interaction;
}

export function lastContact(personId: number): string | null {
  const row = getDb().prepare('SELECT happened_at FROM interactions WHERE person_id = ? ORDER BY happened_at DESC LIMIT 1').get(personId) as { happened_at: string } | undefined;
  return row?.happened_at ?? null;
}

// Suggestions
export function computeSuggestionsFor(forDate: string): DailySuggestion[] {
  const db = getDb();
  const s = getSettings();

  // wipe any prior suggestions for this date so re-run is safe
  db.prepare('DELETE FROM daily_suggestions WHERE for_date = ?').run(forDate);

  if (isQuietDay(s.quiet_days)) {
    return [];
  }

  const people = db.prepare(`SELECT * FROM people WHERE archived_at IS NULL`).all() as Person[];

  const scored = people.map(p => {
    const last = lastContact(p.id);
    const sc = score({
      layer: p.layer,
      cadence_days: p.cadence_days,
      last_contact: last,
      snoozed_until: p.snoozed_until,
      birthday: p.birthday,
      birthday_remind: p.birthday_remind,
    });
    return { person: p, score: sc };
  }).filter(x => x.score > 0).sort((a, b) => b.score - a.score);

  const max = s.max_suggestions_per_day;
  const top = scored.slice(0, max);

  const insert = db.prepare(`
    INSERT INTO daily_suggestions (for_date, person_id, rank, score)
    VALUES (?, ?, ?, ?)
  `);
  top.forEach((t, i) => insert.run(forDate, t.person.id, i + 1, t.score));

  return getSuggestions(forDate);
}

export function getSuggestions(forDate: string): DailySuggestion[] {
  return getDb().prepare(`
    SELECT * FROM daily_suggestions
    WHERE for_date = ? AND dismissed_at IS NULL AND acted_at IS NULL
    ORDER BY rank ASC
  `).all(forDate) as DailySuggestion[];
}

export function getOrComputeSuggestions(): DailySuggestion[] {
  const t = todayIso();
  const existing = getDb().prepare(`SELECT COUNT(*) as c FROM daily_suggestions WHERE for_date = ?`).get(t) as { c: number };
  if (existing.c === 0) return computeSuggestionsFor(t);
  return getSuggestions(t);
}

export function dismissSuggestion(id: number) {
  getDb().prepare(`UPDATE daily_suggestions SET dismissed_at = datetime('now') WHERE id = ?`).run(id);
}

export function markSuggestionActed(personId: number, forDate: string) {
  getDb().prepare(`UPDATE daily_suggestions SET acted_at = datetime('now') WHERE person_id = ? AND for_date = ?`).run(personId, forDate);
}

// Moments
export function listMoments(year?: number): Moment[] {
  if (year) {
    return getDb().prepare(`SELECT * FROM moments WHERE created_at LIKE ? ORDER BY created_at DESC`).all(`${year}-%`) as Moment[];
  }
  return getDb().prepare('SELECT * FROM moments ORDER BY created_at DESC LIMIT 200').all() as Moment[];
}

export function createMoment(body: string, source: 'voice' | 'text' = 'text'): Moment {
  const info = getDb().prepare('INSERT INTO moments (body, source) VALUES (?, ?)').run(body, source);
  return getDb().prepare('SELECT * FROM moments WHERE id = ?').get(info.lastInsertRowid) as Moment;
}

export function hasMomentToday(): boolean {
  const t = todayIso();
  const row = getDb().prepare(`SELECT COUNT(*) as c FROM moments WHERE created_at LIKE ?`).get(`${t}%`) as { c: number };
  return row.c > 0;
}

// Aggregated view for home + people list
export function peopleWithMeta(): Array<Person & { last_contact: string | null; days_since: number | null }> {
  const ppl = listPeople();
  return ppl.map(p => {
    const lc = lastContact(p.id);
    const ds = lc ? Math.floor((Date.now() - new Date(lc).getTime()) / 86_400_000) : null;
    return { ...p, last_contact: lc, days_since: ds };
  });
}

export function birthdaysSoon(daysWindow = 7): Person[] {
  const ppl = listPeople();
  return ppl.filter(p => {
    if (!p.birthday || !p.birthday_remind) return false;
    const parts = p.birthday.split('-');
    const month = parseInt(parts.length === 3 ? parts[1] : parts[0], 10);
    const day = parseInt(parts.length === 3 ? parts[2] : parts[1], 10);
    if (!month || !day) return false;
    const now = new Date();
    let next = new Date(now.getFullYear(), month - 1, day);
    if (next.getTime() < new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()) {
      next = new Date(now.getFullYear() + 1, month - 1, day);
    }
    const d = Math.ceil((next.getTime() - Date.now()) / 86_400_000);
    return d >= 0 && d <= daysWindow;
  });
}
