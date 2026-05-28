'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Layer } from '@/lib/types';

interface ParsedContact {
  name: string;
  phone?: string;
  email?: string;
  birthday?: string;
}

export function ImportFlow() {
  const [contacts, setContacts] = useState<ParsedContact[]>([]);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [layer, setLayer] = useState<Layer>('acquaintance');
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    const r = await fetch('/api/import/vcard', {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: text,
    });
    const data = await r.json();
    setContacts(data.contacts || []);
    setSelected(new Set());
  }

  function toggle(i: number) {
    const s = new Set(selected);
    if (s.has(i)) s.delete(i); else s.add(i);
    setSelected(s);
  }

  async function confirm() {
    setSaving(true);
    const chosen = Array.from(selected).map(i => ({ ...contacts[i], layer }));
    await fetch('/api/import/vcard/confirm', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contacts: chosen }),
    });
    router.push('/people');
  }

  return (
    <div className="space-y-4 mt-2">
      {contacts.length === 0 && (
        <div className="rounded-[var(--radius-card)] border border-dashed border-[var(--color-line)] bg-[var(--color-bg-card)] p-6 text-center shadow-[var(--shadow-card)]">
          <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-[var(--color-accent-soft)] text-[var(--color-accent-ink)]">
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" aria-hidden>
              <path d="M12 15V4m0 0L8.5 7.5M12 4l3.5 3.5M5 14v4a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <p className="text-sm text-[var(--color-ink-soft)]">
            Upload a .vcf file exported from your phone contacts.
          </p>
          <p className="mt-2 text-xs text-[var(--color-ink-faint)]">
            On Android: Contacts app → ⋮ → Share / Export → .vcf
          </p>
          <input type="file" accept=".vcf,text/vcard" onChange={onFile} className="mx-auto mt-4 block text-sm" />
        </div>
      )}

      {contacts.length > 0 && (
        <>
          <div className="flex items-center justify-between">
            <p className="text-sm">{contacts.length} contacts. {selected.size} picked.</p>
            <button onClick={() => setSelected(new Set(contacts.map((_, i) => i)))} className="text-xs text-[var(--color-accent)]">Select all</button>
          </div>

          <div>
            <label className="text-xs uppercase tracking-wider text-[var(--color-ink-faint)]">Starting layer</label>
            <select value={layer} onChange={e => setLayer(e.target.value as Layer)} className="select mt-1">
              <option value="acquaintance">Acquaintance (recommended — sort later)</option>
              <option value="good">Good friend</option>
              <option value="close">Close friend</option>
              <option value="inner">Inner circle</option>
            </select>
            <p className="text-xs text-[var(--color-ink-faint)] mt-1">
              Pick low. On each person's page, tap the layer pills to promote them. Acquaintances surface rarely so nobody you haven't sorted bothers you.
            </p>
          </div>

          <ul className="max-h-[50vh] overflow-hidden overflow-y-auto rounded-[var(--radius-card)] border border-[var(--color-line)] bg-[var(--color-bg-card)] shadow-[var(--shadow-card)] divide-y divide-[var(--color-line-soft)]">
            {contacts.map((c, i) => (
              <li key={i}>
                <label className="flex items-center gap-3 px-3.5 py-3 active:bg-[var(--color-bg-sunken)] transition-colors">
                  <input type="checkbox" checked={selected.has(i)} onChange={() => toggle(i)} className="h-4 w-4 accent-[var(--color-accent)]" />
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-medium">{c.name}</div>
                    <div className="truncate text-xs text-[var(--color-ink-faint)]">
                      {c.phone || c.email || '—'}
                    </div>
                  </div>
                </label>
              </li>
            ))}
          </ul>

          <button onClick={confirm} disabled={selected.size === 0 || saving} className="w-full rounded-[var(--radius-md)] bg-[var(--color-ink)] py-3 font-medium text-[var(--color-bg)] transition-transform active:scale-[.99] disabled:opacity-30">
            {saving ? 'Importing…' : `Add ${selected.size}`}
          </button>
        </>
      )}
    </div>
  );
}
