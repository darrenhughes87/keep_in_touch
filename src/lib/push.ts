// Web Push send + subscription lifecycle.
// Gracefully no-ops if VAPID keys aren't configured.

import webpush from 'web-push';
import { getDb } from './db';

let configured = false;
function ensureConfigured(): boolean {
  if (configured) return true;
  const pub = process.env.VAPID_PUBLIC_KEY;
  const priv = process.env.VAPID_PRIVATE_KEY;
  const subj = process.env.VAPID_SUBJECT || 'mailto:nobody@example.com';
  if (!pub || !priv) return false;
  webpush.setVapidDetails(subj, pub, priv);
  configured = true;
  return true;
}

export function pushAvailable(): boolean {
  return !!(process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY);
}

export function vapidPublicKey(): string | null {
  return process.env.VAPID_PUBLIC_KEY ?? null;
}

interface SubRow { id: number; endpoint: string; p256dh: string; auth: string }

export async function sendToAll(payload: { title: string; body: string; tag?: string }): Promise<{ sent: number; pruned: number }> {
  if (!ensureConfigured()) return { sent: 0, pruned: 0 };
  const db = getDb();
  const subs = db.prepare('SELECT * FROM push_subscriptions').all() as SubRow[];
  const json = JSON.stringify(payload);

  let sent = 0;
  let pruned = 0;
  for (const s of subs) {
    try {
      await webpush.sendNotification(
        { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
        json
      );
      sent++;
    } catch (err: any) {
      // 404/410 mean the subscription is dead. Remove it from the DB.
      const status = err?.statusCode;
      if (status === 404 || status === 410) {
        db.prepare('DELETE FROM push_subscriptions WHERE id = ?').run(s.id);
        pruned++;
      } else {
        console.error('[push] send failed', status, err?.message);
      }
    }
  }
  return { sent, pruned };
}
