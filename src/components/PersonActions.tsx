'use client';

import type { Person } from '@/lib/types';
import { useRouter } from 'next/navigation';

export function PersonActions({ person }: { person: Person }) {
  const router = useRouter();

  async function snooze(days: number) {
    const until = new Date(Date.now() + days * 86_400_000).toISOString();
    await fetch(`/api/people/${person.id}/snooze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ until }),
    });
    router.refresh();
  }

  async function archive() {
    if (!confirm(`Archive ${person.name}? They won't be surfaced anymore. You can restore later.`)) return;
    await fetch(`/api/people/${person.id}/archive`, { method: 'POST' });
    router.push('/people');
  }

  async function logChat() {
    await fetch(`/api/people/${person.id}/interactions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ channel: 'in_person', origin: 'manual_log' }),
    });
    router.refresh();
  }

  return (
    <div className="mt-6 flex flex-wrap gap-2 text-xs">
      <button onClick={logChat} className="px-3 py-1.5 rounded-full bg-stone-100 text-[var(--color-ink-soft)]">
        Log a chat
      </button>
      <button onClick={() => snooze(7)} className="px-3 py-1.5 rounded-full bg-stone-100 text-[var(--color-ink-soft)]">
        Snooze 1w
      </button>
      <button onClick={() => snooze(30)} className="px-3 py-1.5 rounded-full bg-stone-100 text-[var(--color-ink-soft)]">
        Snooze 1m
      </button>
      <button onClick={() => snooze(90)} className="px-3 py-1.5 rounded-full bg-stone-100 text-[var(--color-ink-soft)]">
        Snooze 3m
      </button>
      <button onClick={archive} className="px-3 py-1.5 rounded-full text-[var(--color-ink-faint)] ml-auto">
        Archive
      </button>
    </div>
  );
}
