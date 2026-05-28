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
        <div className="mt-4 flex items-center justify-between gap-3 rounded-[var(--radius-lg)] border border-[var(--color-accent-line)] bg-[var(--color-accent-soft)] p-3.5">
          <p className="flex items-center gap-2 text-sm text-[var(--color-ink)]">
            <CalendarIcon />
            Following up <span className="font-medium">{dueLabel}</span>
          </p>
          <div className="flex shrink-0 gap-3">
            <button onClick={() => setOpen(true)} className="text-xs text-[var(--color-ink-soft)] underline-offset-4 hover:underline">
              Change
            </button>
            <button onClick={clear} className="text-xs text-[var(--color-ink-faint)] underline-offset-4 hover:underline">
              Clear
            </button>
          </div>
        </div>
        {flash && <Toast>{flash}</Toast>}
      </>
    );
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-[var(--radius-lg)] border border-dashed border-[var(--color-line)] px-3 py-2.5 text-sm text-[var(--color-ink-soft)] active:bg-[var(--color-bg-sunken)] transition-colors"
      >
        <CalendarIcon /> Schedule a follow-up
      </button>
    );
  }

  return (
    <>
      <div className="mt-4 space-y-3 rounded-[var(--radius-lg)] border border-[var(--color-line)] bg-[var(--color-bg-card)] p-3.5 shadow-[var(--shadow-card)]">
        <p className="text-xs leading-relaxed text-[var(--color-ink-soft)]">
          Surface this person on your home screen on the day. Any contact (WhatsApp / call / log a chat) will clear it.
        </p>
        <div className="flex flex-wrap gap-2">
          {[[1, 'In 1 day'], [3, 'In 3 days'], [7, 'In 1 week'], [14, 'In 2 weeks']].map(([d, label]) => (
            <button key={d} onClick={() => set(d as number)} className="rounded-full bg-[var(--color-bg-sunken)] px-3.5 py-2 text-xs font-medium text-[var(--color-ink-soft)] active:scale-95 transition-transform">
              {label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={customDate}
            min={new Date().toISOString().slice(0, 10)}
            onChange={e => setCustomDate(e.target.value)}
            className="flex-1 rounded-[var(--radius-md)] border border-[var(--color-line)] bg-[var(--color-bg-sunken)] px-3 py-2 text-sm"
          />
          <button onClick={setCustom} disabled={!customDate} className="rounded-[var(--radius-md)] bg-[var(--color-ink)] px-4 py-2 text-xs font-medium text-[var(--color-bg)] disabled:opacity-30">
            Set
          </button>
        </div>
        <div className="flex justify-end">
          <button onClick={() => { setOpen(false); setCustomDate(''); }} className="text-xs text-[var(--color-ink-faint)]">
            Cancel
          </button>
        </div>
      </div>
      {flash && <Toast>{flash}</Toast>}
    </>
  );
}

function CalendarIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" aria-hidden className="shrink-0">
      <rect x="3.5" y="5" width="17" height="15" rx="2" stroke="currentColor" strokeWidth="1.5" />
      <path d="M3.5 9h17M8 3.5v3M16 3.5v3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function Toast({ children }: { children: React.ReactNode }) {
  return (
    <div role="status" aria-live="polite" className="animate-pop fixed bottom-24 left-1/2 z-50 -translate-x-1/2 rounded-full bg-[var(--color-ink)] px-5 py-2.5 text-sm text-[var(--color-bg)] shadow-[var(--shadow-pop)]">
      {children}
    </div>
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
