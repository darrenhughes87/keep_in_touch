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
    <article className="bg-amber-50 border border-amber-100 rounded-2xl p-4 mb-3">
      <div className="flex items-center gap-3 mb-2">
        <PersonAvatar person={person} size={36} />
        <div className="flex-1 min-w-0">
          <p className="text-sm">
            Still keeping in touch with <span className="font-medium">{first}</span>?
          </p>
          <p className="text-xs text-amber-700/80 mt-0.5">They've been starred — we just want to make sure that's still right.</p>
        </div>
        <span className="text-amber-500 text-lg" aria-hidden>★</span>
      </div>
      <div className="flex gap-2">
        <button onClick={yesStill} className="flex-1 px-3 py-2 rounded-xl text-sm font-medium bg-white border border-amber-200 text-amber-900">
          Yes, still close
        </button>
        <button onClick={noUnstar} className="flex-1 px-3 py-2 rounded-xl text-sm font-medium bg-white border border-stone-200 text-stone-700">
          Surface them again
        </button>
      </div>
    </article>
  );
}
