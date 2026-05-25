export type Layer = 'inner' | 'close' | 'good' | 'acquaintance';

export interface Person {
  id: number;
  name: string;
  nickname: string | null;
  layer: Layer;
  cadence_days: number;
  phone: string | null;
  whatsapp_phone: string | null;
  email: string | null;
  birthday: string | null;
  birthday_remind: number;
  how_we_met: string | null;
  partner_kids: string | null;
  photo_path: string | null;
  notes_facts: string | null;
  snoozed_until: string | null;
  archived_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Note {
  id: number;
  person_id: number;
  body: string;
  source: 'voice' | 'text';
  created_at: string;
}

export interface Interaction {
  id: number;
  person_id: number;
  channel: 'whatsapp' | 'sms' | 'call' | 'email' | 'in_person' | 'other';
  direction: 'out' | 'in';
  happened_at: string;
  origin: 'button_tap' | 'manual_log' | 'confirmed_reach';
  created_at: string;
}

export interface DailySuggestion {
  id: number;
  for_date: string;
  person_id: number;
  rank: number;
  score: number;
  dismissed_at: string | null;
  acted_at: string | null;
  created_at: string;
}

export interface Settings {
  id: number;
  greeting_tone: 'warm' | 'neutral' | 'brief';
  digest_time: string;
  digest_enabled: number;
  max_suggestions_per_day: number;
  quiet_days: string;
  moments_enabled: number;
  cadence_inner: number;
  cadence_close: number;
  cadence_good: number;
  cadence_acquaintance: number;
  onboarded: number;
}

export interface Moment {
  id: number;
  body: string;
  source: 'voice' | 'text';
  created_at: string;
}

export const LAYER_LABELS: Record<Layer, string> = {
  inner: 'Inner circle',
  close: 'Close friend',
  good: 'Good friend',
  acquaintance: 'Acquaintance',
};

export const LAYER_WEIGHTS: Record<Layer, number> = {
  inner: 1.4,
  close: 1.2,
  good: 1.0,
  acquaintance: 0.7,
};
