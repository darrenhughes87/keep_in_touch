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
  followUpDue?: boolean;
}

export function SuggestionCard({ suggestionId, person, daysSince, latestNote, countryCode = '', followUpDue = false }: Props) {
  const [dismissed, setDismissed] = useState(false);
  const [reached, setReached] = useState(false);

  if (dismissed) return null;

  if (reached) {
    return (
      <article className="animate-pop rounded-[var(--radius-card)] border border-[var(--color-good-soft)] bg-[var(--color-good-soft)] px-4 py-5 text-center">
        <div className="mx-auto mb-2 flex h-9 w-9 items-center justify-center rounded-full bg-[var(--color-good)]/15 text-[var(--color-good)]">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" aria-hidden>
            <path d="m5 12.5 4.5 4.5L19 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <p className="text-sm text-[var(--color-ink)]">Nice. {person.name.split(' ')[0]} marked off for today.</p>
      </article>
    );
  }

  async function notNow() {
    setDismissed(true);
    await fetch(`/api/suggestions/${suggestionId}/dismiss`, { method: 'POST' });
  }

  const cadenceLine = followUpDue
    ? `You scheduled a follow-up. Drop ${person.name.split(' ')[0]} a line.`
    : daysSince == null
    ? `You haven't logged a chat with ${person.name} yet.`
    : `You and ${person.name.split(' ')[0]} usually chat every ${dayWord(person.cadence_days)}. It's been ${daysSince} days.`;

  return (
    <article
      className={`animate-rise space-y-3.5 rounded-[var(--radius-card)] border p-4 shadow-[var(--shadow-card)] ${
        followUpDue
          ? 'border-[var(--color-accent-line)] bg-[var(--color-accent-soft)]'
          : 'border-[var(--color-line)] bg-[var(--color-bg-card)]'
      }`}
    >
      <div className="flex items-center gap-3">
        <Link href={`/people/${person.id}`} className="flex min-w-0 flex-1 items-center gap-3">
          <PersonAvatar person={person} size={48} />
          <div className="min-w-0 flex-1">
            <div className="truncate font-medium">{person.name}</div>
            {person.nickname && <div className="text-xs text-[var(--color-ink-faint)]">{person.nickname}</div>}
          </div>
        </Link>
        {followUpDue && (
          <span className="shrink-0 rounded-full bg-[var(--color-accent)]/12 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-[var(--color-accent-ink)]">
            Follow up
          </span>
        )}
      </div>

      <p className="text-sm leading-relaxed text-[var(--color-ink-soft)]">{cadenceLine}</p>

      {latestNote && (
        <p className="rounded-[var(--radius-md)] border border-[var(--color-line-soft)] bg-[var(--color-bg-sunken)] px-3 py-2.5 text-sm leading-relaxed">
          <span className="text-[var(--color-ink-faint)]">
            Last time ({humanDaysAgo(latestNote.created_at)}):{' '}
          </span>
          {latestNote.body}
        </p>
      )}

      <ContactButtons person={person} countryCode={countryCode} onAct={() => setTimeout(() => setReached(true), 800)} />

      <div className="flex items-center justify-between pt-0.5 text-xs">
        <Link href={`/people/${person.id}`} className="text-[var(--color-ink-faint)] underline-offset-4 hover:underline">
          Open profile
        </Link>
        <button onClick={notNow} className="text-[var(--color-ink-faint)] underline-offset-4 hover:underline">
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
