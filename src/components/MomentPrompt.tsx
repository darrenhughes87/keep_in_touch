'use client';

import { useState } from 'react';
import { VoiceNoteInput } from './VoiceNoteInput';

export function MomentPrompt() {
  const [open, setOpen] = useState(false);
  const [saved, setSaved] = useState(false);

  if (saved) {
    return <p className="text-center text-[var(--color-ink-faint)] text-sm mt-10">Saved. See you tomorrow.</p>;
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="block w-full mt-10 text-center text-sm text-[var(--color-ink-soft)] py-4 rounded-2xl border border-dashed border-[var(--color-line)]"
      >
        Anything good happen today worth holding onto?
      </button>
    );
  }

  return (
    <div className="mt-10 space-y-2">
      <h3 className="text-sm font-medium">A moment from today</h3>
      <VoiceNoteInput
        placeholder="One line. Anything you want."
        onSave={async (body, source) => {
          await fetch('/api/moments', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ body, source }),
          });
          setSaved(true);
          setOpen(false);
        }}
      />
    </div>
  );
}
