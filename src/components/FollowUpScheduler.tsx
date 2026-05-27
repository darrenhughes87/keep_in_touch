'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Person } from '@/lib/types';

export function FollowUpScheduler({ person }: { person: Person }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [customDate, setCustomDate] = useState('');
  const [flash, setFlash] = useState<string | null>(null);

  const hasPending = !!person.follow_up_at;
  const dueDate = person.follow_up_at ? new Date(person.follow_up_at) : null;
  const dueLabel = dueDate ? formatDue(dueDate) : null;

  function show(msg: string) {
    setFlash(msg);
    setTimeout(() => setFlash(null), 1800);
  }

  async function set(daysFromNow: number) {
    const until = new Date(Date.now() + daysFromNow * 86_400_000).toISOString();
    await save(until);
    show(`Following up in ${daysFromNow === 1 ? '1 day' : daysFromNow === 7 ? '1 week' : daysFromNow + ' days'}`);
  }

  async function setCustom() {
    if (!customDate) return;
    // Datetime-local input → treat as local. Convert to ISO.
    const dt = new Date(customDate);
    if (isNaN(dt.getTime())) return;
    await save(dt.toISOString());
    show(`Following up on ${dt.toLocaleDateString('en-GB')}`);
  }

  async function clear() {
    await fetch(`/api/people/${person.id}/follow-up`, { method: 'DELETE' });
    show('Follow-up cleared');
    router.refresh();
  }

  async function save(until: string) {
    await fetch(`/api/people/${person.id}/follow-up`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ until }),
    });
    setOpen(false);
    setCustomDate('');
    router.refresh();
  }

  if (hasPending && !open) {
    return (
      <>
        <div className="mt-4 bg-[var(--color-accent-soft)] border border-[var(--color-accent-soft)] rounded-xl p-3 flex items-center justify-between gap-3">
          <p className="text-sm text-[var(--color-ink)]">
            <span aria-hidden>📅</span> Following up <span className="font-medium">{dueLabel}</span>
          </p>
          <div className="flex gap-2 shrink-0">
            <button onClick={() => setOpen(true)} className="text-xs text-[var(--color-ink-soft)] underline-offset-2 hover:underline">
              Change
            </button>
            <button onClick={clear} className="text-xs text-[var(--color-ink-faint)] underline-offset-2 hover:underline">
              Clear
            </button>
          </div>
        </div>
        {flash && (
          <div role="status" aria-live="polite" className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-[var(--color-ink)] text-white px-5 py-2.5 rounded-full text-sm shadow-lg z-50">
            {flash}
          </div>
        )}
      </>
    );
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-4 w-full text-sm py-2 px-3 rounded-xl border border-dashed border-[var(--color-line)] text-[var(--color-ink-soft)] active:bg-stone-100"
      >
        📅 Schedule a follow-up
      </button>
    );
  }

  return (
    <>
      <div className="mt-4 bg-[var(--color-bg-card)] border border-[var(--color-line)] rounded-xl p-3 space-y-3">
        <p className="text-xs text-[var(--color-ink-soft)]">
          Surface this person on your home screen on the day. Any contact (WhatsApp / call / log a chat) will clear it.
        </p>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => set(1)} className="px-3 py-1.5 rounded-full text-xs font-medium bg-stone-100 text-[var(--color-ink-soft)]">In 1 day</button>
          <button onClick={() => set(3)} className="px-3 py-1.5 rounded-full text-xs font-medium bg-stone-100 text-[var(--color-ink-soft)]">In 3 days</button>
          <button onClick={() => set(7)} className="px-3 py-1.5 rounded-full text-xs font-medium bg-stone-100 text-[var(--color-ink-soft)]">In 1 week</button>
          <button onClick={() => set(14)} className="px-3 py-1.5 rounded-full text-xs font-medium bg-stone-100 text-[var(--color-ink-soft)]">In 2 weeks</button>
        </div>
        <div className="flex gap-2 items-center">
          <input
            type="date"
            value={customDate}
            min={new Date().toISOString().slice(0, 10)}
            onChange={e => setCustomDate(e.target.value)}
            className="flex-1 px-3 py-2 rounded-lg border border-[var(--color-line)] bg-white text-sm"
          />
          <button onClick={setCustom} disabled={!customDate} className="px-3 py-2 rounded-lg text-xs font-medium bg-[var(--color-ink)] text-white disabled:opacity-30">
            Set
          </button>
        </div>
        <div className="flex justify-end">
          <button onClick={() => { setOpen(false); setCustomDate(''); }} className="text-xs text-[var(--color-ink-faint)]">
            Cancel
          </button>
        </div>
      </div>
      {flash && (
        <div role="status" aria-live="polite" className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-[var(--color-ink)] text-white px-5 py-2.5 rounded-full text-sm shadow-lg z-50">
          {flash}
        </div>
      )}
    </>
  );
}

function formatDue(d: Date): string {
  const diffMs = d.getTime() - Date.now();
  const days = Math.round(diffMs / 86_400_000);
  if (days < -1) return `${Math.abs(days)} days ago`;
  if (days === -1) return 'yesterday';
  if (days === 0) return 'today';
  if (days === 1) return 'tomorrow';
  if (days < 7) return `in ${days} days`;
  if (days < 14) return 'next week';
  if (days < 60) return `in ${Math.round(days / 7)} weeks`;
  return d.toLocaleDateString('en-GB');
}
