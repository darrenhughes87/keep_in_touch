'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Person } from '@/lib/types';

export function ShareTargetCapture({ initialText }: { initialText: string }) {
  const [text, setText] = useState(initialText);
  const [people, setPeople] = useState<Person[]>([]);
  const [target, setTarget] = useState<number | 'moment' | null>(null);
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetch('/api/people').then(r => r.json()).then(setPeople);
  }, []);

  async function save() {
    if (target == null || !text.trim()) return;
    setSaving(true);
    if (target === 'moment') {
      await fetch('/api/moments', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ body: text, source: 'text' }) });
    } else {
      await fetch(`/api/people/${target}/notes`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ body: text, source: 'text' }) });
    }
    router.replace(target === 'moment' ? '/' : `/people/${target}`);
  }

  return (
    <div className="space-y-4">
      <textarea value={text} onChange={e => setText(e.target.value)} rows={4} className="w-full px-4 py-3 rounded-xl border border-[var(--color-line)] bg-[var(--color-bg-card)]" />
      <div>
        <h3 className="text-xs uppercase tracking-wider text-[var(--color-ink-faint)] mb-2">Save to</h3>
        <button onClick={() => setTarget('moment')} className={`block w-full text-left px-4 py-3 rounded-xl border ${target === 'moment' ? 'border-[var(--color-ink)] bg-[var(--color-bg-card)]' : 'border-[var(--color-line)]'} mb-2`}>
          As a moment (private to you)
        </button>
        <ul className="space-y-1 max-h-72 overflow-y-auto">
          {people.map(p => (
            <li key={p.id}>
              <button onClick={() => setTarget(p.id)} className={`block w-full text-left px-4 py-2 rounded-xl border ${target === p.id ? 'border-[var(--color-ink)] bg-[var(--color-bg-card)]' : 'border-[var(--color-line)]'}`}>
                {p.name}
              </button>
            </li>
          ))}
        </ul>
      </div>
      <button onClick={save} disabled={target == null || !text.trim() || saving} className="w-full bg-[var(--color-ink)] text-white rounded-xl py-3 font-medium disabled:opacity-30">
        {saving ? 'Saving…' : 'Save'}
      </button>
    </div>
  );
}
