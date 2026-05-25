'use client';

import { useState } from 'react';

export function OpenerButton({ personId, personName }: { personId: number; personName: string }) {
  const [text, setText] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  async function generate() {
    setLoading(true);
    try {
      const r = await fetch(`/api/people/${personId}/opener`, { method: 'POST' });
      const data = await r.json();
      setText(data.opener);
    } finally {
      setLoading(false);
    }
  }

  async function copy() {
    if (!text) return;
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="mt-3">
      {!text && (
        <button
          onClick={generate}
          disabled={loading}
          className="w-full text-sm py-2 px-3 rounded-xl border border-dashed border-[var(--color-line)] text-[var(--color-ink-soft)] active:bg-stone-100"
        >
          {loading ? 'Thinking…' : '💡 Suggest an opener'}
        </button>
      )}
      {text && (
        <div className="bg-[var(--color-accent-soft)] rounded-xl p-3">
          <p className="text-sm text-[var(--color-ink)]">{text}</p>
          <div className="flex gap-2 mt-2">
            <button onClick={copy} className="text-xs px-3 py-1.5 rounded-lg bg-white border border-[var(--color-line)]">
              {copied ? '✓ copied' : 'Copy'}
            </button>
            <button onClick={generate} disabled={loading} className="text-xs px-3 py-1.5 rounded-lg bg-white border border-[var(--color-line)]">
              Another
            </button>
            <button onClick={() => setText('')} className="text-xs px-3 py-1.5 rounded-lg text-[var(--color-ink-faint)]">
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
