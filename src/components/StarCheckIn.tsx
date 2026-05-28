'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Person } from '@/lib/types';
import { PersonAvatar } from './PersonAvatar';

export function StarCheckIn({ person }: { person: Person }) {
  const router = useRouter();
  const [dismissed, setDismissed] = useState(false);
  const first = person.name.split(' ')[0];

  if (dismissed) return null;

  async function yesStill() {
    setDismissed(true);
    await fetch(`/api/people/${person.id}/star`, { method: 'PATCH' });
    router.refresh();
  }

  async function noUnstar() {
    setDismissed(true);
    await fetch(`/api/people/${person.id}/star`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ starred: false }),
    });
    router.refresh();
  }

  return (
    <article className="animate-rise mb-3 rounded-[var(--radius-card)] border border-[var(--color-star-soft)] bg-[var(--color-star-soft)] p-4">
      <div className="mb-3 flex items-center gap-3">
        <PersonAvatar person={person} size={38} />
        <div className="min-w-0 flex-1">
          <p className="text-sm">
            Still keeping in touch with <span className="font-medium">{first}</span>?
          </p>
          <p className="mt-0.5 text-xs text-[var(--color-ink-faint)]">Starred — just checking that's still right.</p>
        </div>
        <span className="text-lg text-[var(--color-star)]" aria-hidden>★</span>
      </div>
      <div className="flex gap-2">
        <button
          onClick={yesStill}
          className="flex-1 rounded-[var(--radius-md)] border border-[var(--color-line)] bg-[var(--color-bg-card)] px-3 py-2.5 text-sm font-medium text-[var(--color-ink)] active:scale-[.98] transition-transform"
        >
          Yes, still close
        </button>
        <button
          onClick={noUnstar}
          className="flex-1 rounded-[var(--radius-md)] border border-[var(--color-line)] bg-[var(--color-bg-card)] px-3 py-2.5 text-sm font-medium text-[var(--color-ink-soft)] active:scale-[.98] transition-transform"
        >
          Surface them again
        </button>
      </div>
    </article>
  );
}
