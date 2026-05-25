'use client';

import { useState } from 'react';

export function ResyncCadenceButton() {
  const [state, setState] = useState<'idle' | 'busy' | 'done'>('idle');

  async function run() {
    if (!confirm('Reset every person\'s cadence to the layer default above? This overwrites any custom cadences you set per-person.')) return;
    setState('busy');
    const r = await fetch('/api/people/all/resync-cadence', { method: 'POST' });
    const j = await r.json().catch(() => ({}));
    if (r.ok) {
      setState('done');
      setTimeout(() => setState('idle'), 2500);
    } else {
      console.error(j);
      setState('idle');
    }
  }

  return (
    <button
      type="button"
      onClick={run}
      disabled={state === 'busy'}
      className="mt-3 text-xs text-[var(--color-accent)] underline-offset-2 hover:underline"
    >
      {state === 'idle' && 'Apply these defaults to everyone now'}
      {state === 'busy' && 'Updating…'}
      {state === 'done' && 'Done.'}
    </button>
  );
}
