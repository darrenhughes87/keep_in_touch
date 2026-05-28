'use client';

import { useState } from 'react';
import { VoiceNoteInput } from './VoiceNoteInput';
import type { Note } from '@/lib/types';
import { humanDaysAgo } from '@/lib/time';

export function NoteSection({ personId, initialNotes }: { personId: number; initialNotes: Note[] }) {
  const [notes, setNotes] = useState(initialNotes);

  async function save(body: string, source: 'voice' | 'text') {
    const r = await fetch(`/api/people/${personId}/notes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ body, source }),
    });
    if (r.ok) {
      const created: Note = await r.json();
      setNotes([created, ...notes]);
    }
  }

  async function remove(id: number) {
    if (!confirm('Delete this note?')) return;
    const r = await fetch(`/api/notes/${id}`, { method: 'DELETE' });
    if (r.ok) setNotes(notes.filter(n => n.id !== id));
  }

  return (
    <section className="mt-7">
      <h2 className="mb-2.5 px-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--color-ink-faint)]">Memory</h2>
      <VoiceNoteInput onSave={save} />
      <ul className="mt-3 space-y-2">
        {notes.map(n => (
          <li key={n.id} className="flex gap-2 rounded-[var(--radius-md)] border border-[var(--color-line)] bg-[var(--color-bg-card)] px-3.5 py-3 text-sm shadow-[var(--shadow-card)]">
            <div className="flex-1">
              <p className="whitespace-pre-wrap leading-relaxed">{n.body}</p>
              <p className="mt-1.5 flex items-center gap-1 text-xs text-[var(--color-ink-faint)]">
                {humanDaysAgo(n.created_at)}
                {n.source === 'voice' && (
                  <svg viewBox="0 0 24 24" width="12" height="12" fill="none" aria-label="voice note">
                    <rect x="9" y="3.5" width="6" height="11" rx="3" stroke="currentColor" strokeWidth="1.5" />
                    <path d="M6 11a6 6 0 0 0 12 0M12 17v3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                )}
              </p>
            </div>
            <button onClick={() => remove(n.id)} aria-label="Delete note" className="shrink-0 self-start px-1.5 text-base leading-none text-[var(--color-ink-ghost)] hover:text-[var(--color-danger)]">×</button>
          </li>
        ))}
      </ul>
      {notes.length === 0 && (
        <p className="mt-3 px-2 text-xs leading-relaxed text-[var(--color-ink-faint)]">
          No notes yet. After your next chat, jot one line so future-you has something to lead with.
        </p>
      )}
    </section>
  );
}
