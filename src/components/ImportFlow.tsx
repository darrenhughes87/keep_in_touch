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
        <div className="bg-[var(--color-bg-card)] border border-[var(--color-line)] rounded-xl p-6 text-center">
          <p className="text-sm text-[var(--color-ink-soft)]">
            Upload a .vcf file exported from your phone contacts.
          </p>
          <p className="text-xs text-[var(--color-ink-faint)] mt-2">
            On Android: Contacts app → ⋮ → Share / Export → .vcf
          </p>
          <input type="file" accept=".vcf,text/vcard" onChange={onFile} className="block mx-auto mt-4 text-sm" />
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
            <select value={layer} onChange={e => setLayer(e.target.value as Layer)} className="w-full mt-1 px-3 py-2 rounded-lg border border-[var(--color-line)] bg-white">
              <option value="acquaintance">Acquaintance (recommended — sort later)</option>
              <option value="good">Good friend</option>
              <option value="close">Close friend</option>
              <option value="inner">Inner circle</option>
            </select>
            <p className="text-xs text-[var(--color-ink-faint)] mt-1">
              Pick low. On each person's page, tap the layer pills to promote them. Acquaintances surface rarely so nobody you haven't sorted bothers you.
            </p>
          </div>

          <ul className="space-y-1 max-h-[50vh] overflow-y-auto">
            {contacts.map((c, i) => (
              <li key={i}>
                <label className="flex items-center gap-3 py-2 px-2 rounded-xl">
                  <input type="checkbox" checked={selected.has(i)} onChange={() => toggle(i)} />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{c.name}</div>
                    <div className="text-xs text-[var(--color-ink-faint)] truncate">
                      {c.phone || c.email || '—'}
                    </div>
                  </div>
                </label>
              </li>
            ))}
          </ul>

          <button onClick={confirm} disabled={selected.size === 0 || saving} className="w-full bg-[var(--color-ink)] text-white rounded-xl py-3 font-medium disabled:opacity-30">
            {saving ? 'Importing…' : `Add ${selected.size}`}
          </button>
        </>
      )}
    </div>
  );
}
