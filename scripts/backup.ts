// Nightly SQLite snapshot. Tar + photos -> backups/kit-YYYY-MM-DD.tar.gz
// Keeps 30 most recent. Run via cron (or kit-cron container) at 03:30.

import Database from 'better-sqlite3';
import { mkdirSync, readdirSync, unlinkSync, statSync } from 'node:fs';
import { execSync } from 'node:child_process';
import path from 'node:path';

const dataDir = process.env.DATA_DIR || './data';
const backupDir = process.env.BACKUP_DIR || './backups';
mkdirSync(backupDir, { recursive: true });

const today = new Date().toISOString().slice(0, 10);
const snapshotPath = path.join(backupDir, `kit-${today}.db`);

// Use SQLite online backup API (safe with WAL)
const src = new Database(path.join(dataDir, 'kit.db'), { readonly: true });
src.backup(snapshotPath).then(() => {
  src.close();

  // Bundle snapshot + photos
  const tarPath = path.join(backupDir, `kit-${today}.tar.gz`);
  execSync(`tar -czf "${tarPath}" -C "${backupDir}" "kit-${today}.db" -C "${dataDir}" photos 2>/dev/null || true`, { stdio: 'inherit' });
  unlinkSync(snapshotPath); // remove the loose .db, keep only the tar
  console.log(`[backup] wrote ${tarPath}`);

  // Prune to most-recent 30
  const files = readdirSync(backupDir)
    .filter(f => f.startsWith('kit-') && f.endsWith('.tar.gz'))
    .map(f => ({ f, t: statSync(path.join(backupDir, f)).mtimeMs }))
    .sort((a, b) => b.t - a.t);
  for (const old of files.slice(30)) {
    unlinkSync(path.join(backupDir, old.f));
    console.log(`[backup] pruned ${old.f}`);
  }
}).catch(err => {
  console.error('[backup] failed', err);
  process.exit(1);
});
