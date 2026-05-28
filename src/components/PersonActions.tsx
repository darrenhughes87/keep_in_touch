'use client';

import type { Person } from '@/lib/types';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export function PersonActions({ person }: { person: Person }) {
  const router = useRouter();
  const [toast, setToast] = useState<string | null>(null);

  function flash(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 1800);
  }

  async function snooze(hours: number, label: string) {
    const until = new Date(Date.now() + hours * 3_600_000).toISOString();
    await fetch(`/api/people/${person.id}/snooze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ until }),
    });
    flash(`Snoozed for ${label}`);
    router.refresh();
  }

  async function archive() {
    if (!confirm(`Archive ${person.name}? They won't be surfaced anymore. You can restore later.`)) return;
    await fetch(`/api/people/${person.id}/archive`, { method: 'POST' });
    router.push('/people');
  }

  async function deleteForever() {
    if (!confirm(`Delete ${person.name} forever, including every note and interaction? This cannot be undone.`)) return;
    if (!confirm(`Really delete ${person.name}? Last chance.`)) return;
    await fetch(`/api/people/${person.id}/delete`, { method: 'POST' });
    router.push('/people');
  }

  async function logChat() {
    await fetch(`/api/people/${person.id}/interactions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      // 'other' channel: the button doesn't ask how the chat happened, so
      // recording it as 'in_person' was misleading. 'manual_log' origin
      // distinguishes these from button taps in the UI.
      body: JSON.stringify({ channel: 'other', origin: 'manual_log' }),
    });
    flash('Chat logged');
    router.refresh();
  }

  return (
    <>
      <div className="mt-8 flex flex-wrap items-center gap-2 text-xs">
        <button onClick={logChat} className="rounded-full bg-[var(--color-accent-soft)] px-3.5 py-2 font-medium text-[var(--color-accent-ink)] active:scale-95 transition-transform">
          Log a chat
        </button>
        <button onClick={() => snooze(1, '1 hour')} className="rounded-full bg-[var(--color-bg-sunken)] px-3.5 py-2 text-[var(--color-ink-soft)] active:scale-95 transition-transform">
          Snooze 1h
        </button>
        <button onClick={() => snooze(24, '1 day')} className="rounded-full bg-[var(--color-bg-sunken)] px-3.5 py-2 text-[var(--color-ink-soft)] active:scale-95 transition-transform">
          Snooze 1d
        </button>
        <button onClick={() => snooze(24 * 7, '1 week')} className="rounded-full bg-[var(--color-bg-sunken)] px-3.5 py-2 text-[var(--color-ink-soft)] active:scale-95 transition-transform">
          Snooze 1w
        </button>
        <button onClick={archive} className="ml-auto rounded-full px-3 py-2 text-[var(--color-ink-faint)] active:scale-95 transition-transform">
          Archive
        </button>
        <button onClick={deleteForever} className="rounded-full px-3 py-2 text-[var(--color-danger)] active:scale-95 transition-transform">
          Delete
        </button>
      </div>
      {toast && (
        <div role="status" aria-live="polite" className="animate-pop fixed bottom-24 left-1/2 z-50 -translate-x-1/2 rounded-full bg-[var(--color-ink)] px-5 py-2.5 text-sm text-[var(--color-bg)] shadow-[var(--shadow-pop)]">
          {toast}
        </div>
      )}
    </>
  );
}
