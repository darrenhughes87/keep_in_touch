import { LAYER_WEIGHTS, type Layer } from './types';
import { daysBetween, daysUntilBirthday } from './time';

export interface ScoreInput {
  layer: Layer;
  cadence_days: number;
  last_contact: string | null;
  snoozed_until: string | null;
  birthday: string | null;
  birthday_remind: number;
  starred?: number;
}

export function score(p: ScoreInput): number {
  // Starred → never surfaced; the user already messages them often.
  // A periodic check-in card asks them to confirm; if not confirmed within
  // 30 days the star is auto-removed and they return to the normal schedule.
  if (p.starred) return 0;

  // snoozed → zero
  if (p.snoozed_until && new Date(p.snoozed_until).getTime() > Date.now()) return 0;

  const target = Math.max(1, p.cadence_days);
  const daysSince = p.last_contact ? daysBetween(p.last_contact) : target * 3; // never-contacted = strong
  const drift = daysSince / target;

  const weight = LAYER_WEIGHTS[p.layer];

  let bday = 0;
  if (p.birthday_remind) {
    const d = daysUntilBirthday(p.birthday);
    if (d !== null && d <= 7) bday = 0.5;
  }

  return drift * weight * (1 + bday);
}
