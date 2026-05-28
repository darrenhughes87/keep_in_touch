'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function StarToggle({ personId, starred, firstName }: { personId: number; starred: boolean; firstName: string }) {
  const router = useRouter();
  const [on, setOn] = useState(starred);
  const [busy, setBusy] = useState(false);

  async function toggle() {
    const next = !on;
    setOn(next);
    setBusy(true);
    await fetch(`/api/people/${personId}/star`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ starred: next }),
    });
    setBusy(false);
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={busy}
      aria-pressed={on}
      aria-label={on ? `Unstar ${firstName}` : `Star ${firstName}`}
      className={`-my-1 -mr-2 px-2 text-2xl transition-colors ${on ? 'text-[var(--color-star)]' : 'text-[var(--color-star-ghost)] hover:text-[var(--color-star)]'}`}
      title={on ? `Starred. ${firstName} won't be surfaced — we'll check in every 30 days.` : `Star ${firstName} to skip daily suggestions for people you already see often.`}
    >
      {on ? '★' : '☆'}
    </button>
  );
}
