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
  _db = db;
  return db;
}

export function photosDir(): string {
  const dataDir = process.env.DATA_DIR || './data';
  return path.join(dataDir, 'photos');
}
