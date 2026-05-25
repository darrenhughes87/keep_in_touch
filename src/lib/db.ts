import Database from 'better-sqlite3';
import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { SCHEMA } from './schema';

let _db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (_db) return _db;
  const dataDir = process.env.DATA_DIR || './data';
  mkdirSync(dataDir, { recursive: true });
  mkdirSync(path.join(dataDir, 'photos'), { recursive: true });
  const dbPath = path.join(dataDir, 'kit.db');
  const db = new Database(dbPath);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  db.exec(SCHEMA);

  // Additive migrations for existing DBs (each ALTER is wrapped to swallow
  // "duplicate column" errors so they're safe to run every boot).
  // Each statement is wrapped to swallow benign errors so they're safe to
  // run on every boot. ALTERs throw "duplicate column" if already applied.
  // CREATE INDEX IF NOT EXISTS is idempotent.
  const adds = [
    "ALTER TABLE settings ADD COLUMN default_country_code TEXT NOT NULL DEFAULT ''",
    "ALTER TABLE people   ADD COLUMN starred              INTEGER NOT NULL DEFAULT 0",
    "ALTER TABLE people   ADD COLUMN star_checked_at      TEXT",
    "CREATE INDEX IF NOT EXISTS idx_people_starred ON people(starred)",
    // Backfill moments_fts on existing DBs: the FTS table + triggers were
    // added later, so historical moments need re-indexing once.
    "INSERT INTO moments_fts(rowid, body) SELECT id, body FROM moments WHERE id NOT IN (SELECT rowid FROM moments_fts)",
  ];
  for (const sql of adds) {
    try { db.exec(sql); } catch (e: any) {
      if (!/duplicate column/i.test(e?.message ?? '')) throw e;
    }
  }

  _db = db;
  return db;
}

export function photosDir(): string {
  const dataDir = process.env.DATA_DIR || './data';
  return path.join(dataDir, 'photos');
}
