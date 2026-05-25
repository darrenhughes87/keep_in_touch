'use client';

import Link from 'next/link';
import type { Person, Note } from '@/lib/types';
import { PersonAvatar } from './PersonAvatar';
import { ContactButtons } from './ContactButtons';
import { humanDaysAgo } from '@/lib/time';
import { useState } from 'react';

interface Props {
  suggestionId: number;
  person: Person;
  daysSince: number | null;
  latestNote: Note | null;
  countryCode?: string;
}

export function SuggestionCard({ suggestionId, person, daysSince, latestNote, countryCode = '' }: Props) {
  const [dismissed, setDismissed] = useState(false);
  const [reached, setReached] = useState(false);

  if (dismissed) return null;

  if (reached) {
    return (
      <article className="bg-[var(--color-accent-soft)] rounded-2xl border border-[var(--color-accent-soft)] p-4 text-center">
        <p className="text-sm text-[var(--color-ink)]">Nice. {person.name.split(' ')[0]} marked off for today.</p>
      </article>
    );
  }

  async function notNow() {
    setDismissed(true);
    await fetch(`/api/suggestions/${suggestionId}/dismiss`, { method: 'POST' });
  }

  const cadenceLine = daysSince == null
    ? `You haven't logged a chat with ${person.name} yet.`
    : `You and ${person.name.split(' ')[0]} usually chat every ${dayWord(person.cadence_days)}. It's been ${daysSince} days.`;

  return (
    <article className="bg-[var(--color-bg-card)] rounded-2xl border border-[var(--color-line)] p-4 space-y-3 shadow-sm">
      <Link href={`/people/${person.id}`} className="flex items-center gap-3">
        <PersonAvatar person={person} size={48} />
        <div className="flex-1 min-w-0">
          <div className="font-medium truncate">{person.name}</div>
          {person.nickname && <div className="text-xs text-[var(--color-ink-faint)]">{person.nickname}</div>}
        </div>
      </Link>
      <p className="text-sm text-[var(--color-ink-soft)]">{cadenceLine}</p>
      {latestNote && (
        <p className="text-sm bg-[var(--color-bg)] rounded-xl px-3 py-2 border border-[var(--color-line)]">
          <span className="text-[var(--color-ink-faint)]">
            Last time ({humanDaysAgo(latestNote.created_at)}):{' '}
          </span>
          {latestNote.body}
        </p>
      )}
      <ContactButtons person={person} compact countryCode={countryCode} onAct={() => setTimeout(() => setReached(true), 800)} />
      <div className="flex items-center justify-between text-xs">
        <Link href={`/people/${person.id}`} className="text-[var(--color-ink-faint)] underline-offset-2 hover:underline">
          Open
        </Link>
        <button onClick={notNow} className="text-[var(--color-ink-faint)] underline-offset-2 hover:underline">
          not now
        </button>
      </div>
    </article>
  );
}

function dayWord(n: number): string {
  if (n <= 1) return 'day';
  if (n <= 9) return `${n} days`;
  if (n <= 14) return 'couple of weeks';
  if (n <= 21) return '3 weeks';
  if (n <= 35) return 'month';
  if (n <= 70) return 'couple of months';
  if (n <= 120) return '3 months';
  if (n <= 200) return '6 months';
  return 'year';
}
