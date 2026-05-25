'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import type { Layer } from '@/lib/types';

const LAYERS: { v: Layer; short: string; long: string }[] = [
  { v: 'inner',        short: 'Inner',  long: 'Inner circle' },
  { v: 'close',        short: 'Close',  long: 'Close friend' },
  { v: 'good',         short: 'Good',   long: 'Good friend' },
  { v: 'acquaintance', short: 'Acq',    long: 'Acquaintance' },
];

// Inline tap-to-change layer pill row, used on the person detail page.
// Lets you re-categorise without going through the full Edit form —
// matters most after a bulk vCard import where everyone lands as Acquaintance.
export function LayerPicker({ personId, current }: { personId: number; current: Layer }) {
  const router = useRouter();
  const [value, setValue] = useState<Layer>(current);
  const [busy, setBusy] = useState(false);

  async function set(layer: Layer) {
    if (layer === value) return;
    setBusy(true);
    const prev = value;
    setValue(layer); // optimistic
    const r = await fetch(`/api/people/${personId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ layer }),
    });
    setBusy(false);
    if (!r.ok) {
      setValue(prev);
      return;
    }
    router.refresh();
  }

  return (
    <div className="flex gap-1.5 mt-2 flex-wrap" aria-busy={busy}>
      {LAYERS.map(({ v, short, long }) => {
        const active = v === value;
        return (
          <button
            key={v}
            type="button"
            onClick={() => set(v)}
            className={`text-xs px-2.5 py-1 rounded-full border ${
              active
                ? 'bg-[var(--color-ink)] text-white border-[var(--color-ink)]'
                : 'border-[var(--color-line)] text-[var(--color-ink-soft)] active:bg-stone-100'
            }`}
            aria-label={`Set layer to ${long}`}
          >
            {short}
          </button>
        );
      })}
    </div>
  );
}
