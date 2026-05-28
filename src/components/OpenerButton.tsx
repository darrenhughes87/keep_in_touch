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
          className="flex w-full items-center justify-center gap-2 rounded-[var(--radius-lg)] border border-dashed border-[var(--color-line)] px-3 py-2.5 text-sm text-[var(--color-ink-soft)] active:bg-[var(--color-bg-sunken)] transition-colors"
        >
          {loading ? (
            'Thinking…'
          ) : (
            <>
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" aria-hidden>
                <path d="M9 17h6M10 20h4M12 3a6 6 0 0 1 3.6 10.8c-.6.5-.9 1-.9 1.7H9.3c0-.7-.3-1.2-.9-1.7A6 6 0 0 1 12 3Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Suggest an opener
            </>
          )}
        </button>
      )}
      {text && (
        <div className="animate-pop rounded-[var(--radius-lg)] border border-[var(--color-accent-line)] bg-[var(--color-accent-soft)] p-3.5">
          <p className="text-sm leading-relaxed text-[var(--color-ink)]">{text}</p>
          <div className="mt-3 flex gap-2">
            <button onClick={copy} className="rounded-[var(--radius-md)] border border-[var(--color-line)] bg-[var(--color-bg-card)] px-3 py-1.5 text-xs font-medium">
              {copied ? '✓ copied' : 'Copy'}
            </button>
            <button onClick={generate} disabled={loading} className="rounded-[var(--radius-md)] border border-[var(--color-line)] bg-[var(--color-bg-card)] px-3 py-1.5 text-xs font-medium">
              Another
            </button>
            <button onClick={() => setText('')} className="ml-auto rounded-[var(--radius-md)] px-3 py-1.5 text-xs text-[var(--color-ink-faint)]">
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
