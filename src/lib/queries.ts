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
      onboarded=@onboarded,
      default_country_code=@default_country_code
    WHERE id = 1
  `).run(merged);
  return getSettings();
}

export function defaultCadenceFor(layer: Layer): number {
  const s = getSettings();
  return s[`cadence_${layer}` as keyof Settings] as number;
}

export function listPeople(opts: { layer?: Layer; archived?: boolean; search?: string; starred?: boolean } = {}): Person[] {
  const db = getDb();
  // If there's a search query, also pull in people whose notes match —
  // so searching "chemo" returns Steve even if "chemo" isn't in his name.
  const noteMatchIds = new Set<number>();
  if (opts.search) {
    try {
      const rows = db.prepare(`
        SELECT DISTINCT person_id FROM notes_fts
        JOIN notes ON notes.id = notes_fts.rowid
        WHERE notes_fts MATCH ?
      `).all(opts.search + '*') as Array<{ person_id: number }>;
      rows.forEach(r => noteMatchIds.add(r.person_id));
    } catch { /* malformed FTS query, ignore */ }
  }

  let sql = 'SELECT * FROM people WHERE 1=1';
  const params: Record<string, unknown> = {};
  if (!opts.archived) sql += ' AND archived_at IS NULL';
  if (opts.layer) {
    sql += ' AND layer = @layer';
    params.layer = opts.layer;
  }
  if (opts.starred) sql += ' AND starred = 1';
  if (opts.search) {
    if (noteMatchIds.size > 0) {
      const placeholders = Array.from(noteMatchIds).map((_, i) => `@nid${i}`).join(',');
      sql += ` AND (name LIKE @q OR nickname LIKE @q OR id IN (${placeholders}))`;
      Array.from(noteMatchIds).forEach((id, i) => { params[`nid${i}`] = id; });
    } else {
      sql += ' AND (name LIKE @q OR nickname LIKE @q)';
    }
    params.q = `%${opts.search}%`;
  }
  sql += ' ORDER BY name COLLATE NOCASE';
  return db.prepare(sql).all(params) as Person[];
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
  // When the layer changes and the caller didn't also pass a new cadence,
  // snap cadence_days to the new layer's default — but ONLY if the current
  // cadence is still the old layer's default. If they've customised it,
  // leave the custom value alone.
  if (patch.layer && patch.layer !== cur.layer && patch.cadence_days === undefined) {
    const oldDefault = defaultCadenceFor(cur.layer);
    if (cur.cadence_days === oldDefault) {
      patch = { ...patch, cadence_days: defaultCadenceFor(patch.layer) };
    }
  }
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
  const db = getDb();
  db.prepare(`UPDATE people SET snoozed_until = ? WHERE id = ?`).run(untilIso, id);
  // Same pattern as setStar: today's daily_suggestions row is already computed,
  // so just flipping snoozed_until on the person record wasn't enough to make
  // them disappear from the home screen. Delete the pre-computed suggestion.
  db.prepare(`DELETE FROM daily_suggestions WHERE person_id = ?`).run(id);
}

export function scheduleFollowUp(id: number, untilIso: string) {
  getDb().prepare(`UPDATE people SET follow_up_at = ? WHERE id = ?`).run(untilIso, id);
}

export function clearFollowUp(id: number) {
  getDb().prepare(`UPDATE people SET follow_up_at = NULL WHERE id = ?`).run(id);
}

// People whose scheduled follow-up has come due. Surfaces ABOVE the normal
// daily suggestions on the home screen, ignoring snooze/star (a follow-up
// is a deliberate appointment Darren set, it should win).
export function followUpsDue(): Person[] {
  return getDb().prepare(`
    SELECT * FROM people
    WHERE archived_at IS NULL
      AND follow_up_at IS NOT NULL
      AND follow_up_at <= datetime('now')
    ORDER BY follow_up_at ASC
  `).all() as Person[];
}

export function setStar(id: number, starred: boolean) {
  const db = getDb();
  const checked = starred ? new Date().toISOString() : null;
  db.prepare(`UPDATE people SET starred = ?, star_checked_at = ? WHERE id = ?`).run(starred ? 1 : 0, checked, id);
  // If we just starred someone, also remove them from any already-computed
  // daily suggestions so they disappear from today's home screen immediately.
  // (daily_suggestions is computed once a day, so starring after the morning
  //  compute would otherwise leave a stale card up until tomorrow.)
  if (starred) {
    db.prepare(`DELETE FROM daily_suggestions WHERE person_id = ?`).run(id);
  }
}

export function confirmStar(id: number) {
  getDb().prepare(`UPDATE people SET star_checked_at = datetime('now') WHERE id = ?`).run(id);
}

// People who are starred AND haven't been confirmed in the last 30 days.
// These surface a gentle "Are you still keeping in touch with X?" card on home.
export function starsNeedingCheckIn(daysOld = 30, limit = 3): Person[] {
  return getDb().prepare(`
    SELECT * FROM people
    WHERE archived_at IS NULL
      AND starred = 1
      AND (star_checked_at IS NULL OR julianday('now') - julianday(star_checked_at) > ?)
    ORDER BY star_checked_at IS NULL DESC, star_checked_at ASC
    LIMIT ?
  `).all(daysOld, limit) as Person[];
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

export function searchMoments(q: string): Moment[] {
  return getDb().prepare(`
    SELECT m.*
    FROM moments_fts f
    JOIN moments m ON m.id = f.rowid
    WHERE moments_fts MATCH ?
    ORDER BY m.created_at DESC
    LIMIT 50
  `).all(q + '*') as Moment[];
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
  const db = getDb();
  const info = db.prepare(`
    INSERT INTO interactions (person_id, channel, direction, origin)
    VALUES (?, ?, ?, ?)
  `).run(personId, channel, direction, origin);
  // Any actual contact closes a pending follow-up — that was the whole point.
  db.prepare(`UPDATE people SET follow_up_at = NULL WHERE id = ? AND follow_up_at IS NOT NULL`).run(personId);
  return db.prepare('SELECT * FROM interactions WHERE id = ?').get(info.lastInsertRowid) as Interaction;
}

export function lastContact(personId: number): string | null {
  const row = getDb().prepare('SELECT happened_at FROM interactions WHERE person_id = ? ORDER BY happened_at DESC LIMIT 1').get(personId) as { happened_at: string } | undefined;
  return row?.happened_at ?? null;
}

// Suggestions
// Refreshes the suggestion list for `forDate`. This is a queue, not a daily
// snapshot: anyone you haven't acted on rolls forward to today instead of
// being wiped, so the list GROWS while you ignore it and shrinks only when you
// contact someone (which pushes them past their cadence) or dismiss them.
//
//  - "due" = past their cadence (drift >= 1), per scoring.ts.
//  - A person you contacted drops off until a full cadence passes again.
//  - Each day introduces at most `max_suggestions_per_day` NEW names; the
//    carried-over backlog is never capped, so a skipped day makes the list
//    bigger the next day rather than resetting it.
//  - Quiet days add no new names, but the existing backlog still stands.
export function computeSuggestionsFor(forDate: string): DailySuggestion[] {
  const db = getDb();
  const s = getSettings();

  const people = db.prepare(`SELECT * FROM people WHERE archived_at IS NULL`).all() as Person[];

  // Everyone currently due, strongest drift first.
  const due = people.map(p => ({
    person: p,
    score: score({
      layer: p.layer,
      cadence_days: p.cadence_days,
      last_contact: lastContact(p.id),
      snoozed_until: p.snoozed_until,
      birthday: p.birthday,
      birthday_remind: p.birthday_remind,
      starred: p.starred,
    }),
  })).filter(x => x.score > 0).sort((a, b) => b.score - a.score);

  const scoreById = new Map(due.map(d => [d.person.id, d.score] as const));

  // All still-open (un-acted, un-dismissed) suggestion rows, from any date.
  const open = db.prepare(`
    SELECT * FROM daily_suggestions WHERE acted_at IS NULL AND dismissed_at IS NULL
  `).all() as DailySuggestion[];

  const dropStale = db.prepare('DELETE FROM daily_suggestions WHERE id = ?');
  const roll = db.prepare('UPDATE daily_suggestions SET for_date = ?, score = ? WHERE id = ?');
  const carried = new Set<number>();

  for (const row of open) {
    if (!scoreById.has(row.person_id)) {
      // No longer due (contacted, snoozed, starred, archived) → leave the list.
      dropStale.run(row.id);
      continue;
    }
    // Still due → carry forward to today with a refreshed score.
    roll.run(forDate, scoreById.get(row.person_id)!, row.id);
    carried.add(row.person_id);
  }

  // Introduce up to N brand-new names (not on a quiet day).
  if (!isQuietDay(s.quiet_days)) {
    const insert = db.prepare(`
      INSERT OR IGNORE INTO daily_suggestions (for_date, person_id, rank, score)
      VALUES (?, ?, ?, ?)
    `);
    due.filter(d => !carried.has(d.person.id))
      .slice(0, s.max_suggestions_per_day)
      .forEach(f => insert.run(forDate, f.person.id, 0, f.score));
  }

  // Re-rank today's open list by score so the home screen ordering is stable.
  const todays = db.prepare(`
    SELECT id FROM daily_suggestions
    WHERE for_date = ? AND acted_at IS NULL AND dismissed_at IS NULL
    ORDER BY score DESC, id ASC
  `).all(forDate) as Array<{ id: number }>;
  const setRank = db.prepare('UPDATE daily_suggestions SET rank = ? WHERE id = ?');
  todays.forEach((r, i) => setRank.run(i + 1, r.id));

  return getSuggestions(forDate);
}

export function getSuggestions(forDate: string): DailySuggestion[] {
  // Belt-and-braces: filter out anyone who became starred, archived, or
  // snoozed after the daily compute (the respective setters already delete
  // their suggestion row, but a stale row shouldn't show either).
  return getDb().prepare(`
    SELECT s.* FROM daily_suggestions s
    JOIN people p ON p.id = s.person_id
    WHERE s.for_date = ?
      AND s.dismissed_at IS NULL
      AND s.acted_at IS NULL
      AND p.archived_at IS NULL
      AND p.starred = 0
      AND (p.snoozed_until IS NULL OR p.snoozed_until <= datetime('now'))
    ORDER BY s.rank ASC
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
