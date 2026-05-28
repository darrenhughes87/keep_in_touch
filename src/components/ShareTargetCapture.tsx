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
      <textarea value={text} onChange={e => setText(e.target.value)} rows={4} className="field leading-relaxed" />
      <div>
        <h3 className="eyebrow">Save to</h3>
        <button onClick={() => setTarget('moment')} className={`mb-2 block w-full rounded-[var(--radius-md)] border px-4 py-3 text-left transition-colors ${target === 'moment' ? 'border-[var(--color-accent)] bg-[var(--color-accent-soft)]' : 'border-[var(--color-line)] bg-[var(--color-bg-card)]'}`}>
          As a moment (private to you)
        </button>
        <ul className="max-h-72 space-y-1.5 overflow-y-auto">
          {people.map(p => (
            <li key={p.id}>
              <button onClick={() => setTarget(p.id)} className={`block w-full rounded-[var(--radius-md)] border px-4 py-2.5 text-left transition-colors ${target === p.id ? 'border-[var(--color-accent)] bg-[var(--color-accent-soft)]' : 'border-[var(--color-line)] bg-[var(--color-bg-card)]'}`}>
                {p.name}
              </button>
            </li>
          ))}
        </ul>
      </div>
      <button onClick={save} disabled={target == null || !text.trim() || saving} className="w-full rounded-[var(--radius-md)] bg-[var(--color-ink)] py-3 font-medium text-[var(--color-bg)] transition-transform active:scale-[.99] disabled:opacity-30">
        {saving ? 'Saving…' : 'Save'}
      </button>
    </div>
  );
}
