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
    <section className="mt-6">
      <h2 className="text-xs uppercase tracking-wider text-[var(--color-ink-faint)] mb-2">Memory</h2>
      <VoiceNoteInput onSave={save} />
      <ul className="mt-3 space-y-2">
        {notes.map(n => (
          <li key={n.id} className="bg-[var(--color-bg-card)] rounded-xl border border-[var(--color-line)] px-3 py-2 text-sm flex gap-2">
            <div className="flex-1">
              <p className="whitespace-pre-wrap">{n.body}</p>
              <p className="text-xs text-[var(--color-ink-faint)] mt-1">
                {humanDaysAgo(n.created_at)} {n.source === 'voice' ? '· 🎙' : ''}
              </p>
            </div>
            <button onClick={() => remove(n.id)} aria-label="Delete note" className="text-[var(--color-ink-faint)] text-xs px-2">×</button>
          </li>
        ))}
      </ul>
      {notes.length === 0 && (
        <p className="text-xs text-[var(--color-ink-faint)] mt-3 px-2">
          No notes yet. After your next chat, jot one line so future-you has something to lead with.
        </p>
      )}
    </section>
  );
}
