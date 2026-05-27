// Schema embedded as a TS string so it survives Next.js standalone bundling.
// Keep in sync with schema.sql (which stays around for reference / sqlite tooling).
export const SCHEMA = `
CREATE TABLE IF NOT EXISTS people (
  id              INTEGER PRIMARY KEY,
  name            TEXT NOT NULL,
  nickname        TEXT,
  layer           TEXT NOT NULL CHECK (layer IN ('inner','close','good','acquaintance')),
  cadence_days    INTEGER NOT NULL,
  phone           TEXT,
  whatsapp_phone  TEXT,
  email           TEXT,
  birthday        TEXT,
  birthday_remind INTEGER NOT NULL DEFAULT 1,
  how_we_met      TEXT,
  partner_kids    TEXT,
  photo_path      TEXT,
  notes_facts     TEXT,
  snoozed_until   TEXT,
  archived_at     TEXT,
  starred         INTEGER NOT NULL DEFAULT 0,
  star_checked_at TEXT,
  follow_up_at    TEXT,
  created_at      TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at      TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_people_archived ON people(archived_at);
CREATE INDEX IF NOT EXISTS idx_people_layer    ON people(layer);
-- idx_people_starred is created in the runtime migration in db.ts so that
-- existing databases (which need the column added via ALTER first) don't fail
-- on the IF NOT EXISTS index check.

CREATE TABLE IF NOT EXISTS notes (
  id           INTEGER PRIMARY KEY,
  person_id    INTEGER NOT NULL REFERENCES people(id) ON DELETE CASCADE,
  body         TEXT NOT NULL,
  source       TEXT NOT NULL CHECK (source IN ('voice','text')) DEFAULT 'text',
  created_at   TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_notes_person ON notes(person_id, created_at DESC);

CREATE VIRTUAL TABLE IF NOT EXISTS notes_fts USING fts5(body, content='notes', content_rowid='id');

CREATE TRIGGER IF NOT EXISTS notes_ai AFTER INSERT ON notes BEGIN
  INSERT INTO notes_fts(rowid, body) VALUES (new.id, new.body);
END;
CREATE TRIGGER IF NOT EXISTS notes_ad AFTER DELETE ON notes BEGIN
  INSERT INTO notes_fts(notes_fts, rowid, body) VALUES('delete', old.id, old.body);
END;
CREATE TRIGGER IF NOT EXISTS notes_au AFTER UPDATE ON notes BEGIN
  INSERT INTO notes_fts(notes_fts, rowid, body) VALUES('delete', old.id, old.body);
  INSERT INTO notes_fts(rowid, body) VALUES (new.id, new.body);
END;

CREATE TABLE IF NOT EXISTS interactions (
  id           INTEGER PRIMARY KEY,
  person_id    INTEGER NOT NULL REFERENCES people(id) ON DELETE CASCADE,
  channel      TEXT NOT NULL CHECK (channel IN ('whatsapp','sms','call','email','in_person','other')),
  direction    TEXT NOT NULL DEFAULT 'out' CHECK (direction IN ('out','in')),
  happened_at  TEXT NOT NULL DEFAULT (datetime('now')),
  origin       TEXT NOT NULL CHECK (origin IN ('button_tap','manual_log','confirmed_reach')),
  created_at   TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_interactions_person ON interactions(person_id, happened_at DESC);

CREATE TABLE IF NOT EXISTS daily_suggestions (
  id            INTEGER PRIMARY KEY,
  for_date      TEXT NOT NULL,
  person_id     INTEGER NOT NULL REFERENCES people(id) ON DELETE CASCADE,
  rank          INTEGER NOT NULL,
  score         REAL NOT NULL,
  dismissed_at  TEXT,
  acted_at      TEXT,
  created_at    TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(for_date, person_id)
);
CREATE INDEX IF NOT EXISTS idx_suggestions_date ON daily_suggestions(for_date);

CREATE TABLE IF NOT EXISTS moments (
  id           INTEGER PRIMARY KEY,
  body         TEXT NOT NULL,
  source       TEXT NOT NULL CHECK (source IN ('voice','text')) DEFAULT 'text',
  created_at   TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_moments_date ON moments(created_at);

CREATE VIRTUAL TABLE IF NOT EXISTS moments_fts USING fts5(body, content='moments', content_rowid='id');

CREATE TRIGGER IF NOT EXISTS moments_ai AFTER INSERT ON moments BEGIN
  INSERT INTO moments_fts(rowid, body) VALUES (new.id, new.body);
END;
CREATE TRIGGER IF NOT EXISTS moments_ad AFTER DELETE ON moments BEGIN
  INSERT INTO moments_fts(moments_fts, rowid, body) VALUES('delete', old.id, old.body);
END;
CREATE TRIGGER IF NOT EXISTS moments_au AFTER UPDATE ON moments BEGIN
  INSERT INTO moments_fts(moments_fts, rowid, body) VALUES('delete', old.id, old.body);
  INSERT INTO moments_fts(rowid, body) VALUES (new.id, new.body);
END;

CREATE TABLE IF NOT EXISTS settings (
  id                       INTEGER PRIMARY KEY CHECK (id = 1),
  greeting_tone            TEXT NOT NULL DEFAULT 'warm',
  digest_time              TEXT NOT NULL DEFAULT '08:30',
  digest_enabled           INTEGER NOT NULL DEFAULT 1,
  max_suggestions_per_day  INTEGER NOT NULL DEFAULT 3,
  quiet_days               TEXT NOT NULL DEFAULT '',
  moments_enabled          INTEGER NOT NULL DEFAULT 0,
  cadence_inner            INTEGER NOT NULL DEFAULT 7,
  cadence_close            INTEGER NOT NULL DEFAULT 21,
  cadence_good             INTEGER NOT NULL DEFAULT 60,
  cadence_acquaintance     INTEGER NOT NULL DEFAULT 180,
  onboarded                INTEGER NOT NULL DEFAULT 0,
  default_country_code     TEXT NOT NULL DEFAULT ''
);
INSERT OR IGNORE INTO settings (id) VALUES (1);

-- Additive migration for existing installs that pre-date default_country_code.
-- SQLite ALTER TABLE accepts ADD COLUMN; we guard with a no-op selector since
-- there's no IF NOT EXISTS. The exec() call ignores the duplicate-column error.
-- (Wrapped in a SELECT 1 so older sqlite versions still parse the block.)

CREATE TABLE IF NOT EXISTS push_subscriptions (
  id           INTEGER PRIMARY KEY,
  endpoint     TEXT NOT NULL UNIQUE,
  p256dh       TEXT NOT NULL,
  auth         TEXT NOT NULL,
  created_at   TEXT NOT NULL DEFAULT (datetime('now'))
);
`;
