'use client';

import { useState } from 'react';

export function BriefingButton() {
  const [state, setState] = useState<'idle' | 'loading' | 'speaking' | 'done' | 'error'>('idle');
  const [script, setScript] = useState<string>('');

  async function play() {
    if (state === 'speaking') {
      window.speechSynthesis.cancel();
      setState('done');
      return;
    }
    setState('loading');
    try {
      const r = await fetch('/api/briefing');
      if (!r.ok) throw new Error('briefing failed');
      const data = await r.json();
      const text = data.script as string;
      setScript(text);
      speak(text, () => setState('done'));
      setState('speaking');
    } catch {
      setState('error');
    }
  }

  return (
    <div className="mb-3">
      <button
        onClick={play}
        className="flex w-full items-center justify-center gap-2.5 rounded-[var(--radius-lg)] border border-[var(--color-line)] bg-[var(--color-bg-card)] px-4 py-3 text-sm font-medium shadow-[var(--shadow-card)] active:scale-[.99] transition-transform"
        aria-label="Play briefing"
      >
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--color-accent-soft)] text-[var(--color-accent-ink)]" aria-hidden>
          {state === 'speaking' ? (
            <svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor" aria-hidden>
              <rect x="7" y="6" width="3.4" height="12" rx="1" />
              <rect x="13.6" y="6" width="3.4" height="12" rx="1" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor" aria-hidden>
              <path d="M8 6.2c0-.8.9-1.3 1.6-.9l8 4.8a1 1 0 0 1 0 1.8l-8 4.8c-.7.4-1.6-.1-1.6-.9V6.2Z" />
            </svg>
          )}
        </span>
        <span>
          {state === 'idle' && 'Listen (20s)'}
          {state === 'loading' && 'Preparing…'}
          {state === 'speaking' && 'Tap to stop'}
          {state === 'done' && 'Play again'}
          {state === 'error' && 'Try again'}
        </span>
      </button>
      {script && state !== 'idle' && (
        <p className="mt-2 px-2 text-xs leading-relaxed text-[var(--color-ink-faint)]">{script}</p>
      )}
    </div>
  );
}

function speak(text: string, onEnd: () => void) {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    onEnd();
    return;
  }
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = 'en-GB';
  u.rate = 1.0;
  u.pitch = 1.0;
  // Try to pick a UK English voice if available
  const voices = window.speechSynthesis.getVoices();
  const ukVoice = voices.find(v => v.lang.startsWith('en-GB')) || voices.find(v => v.lang.startsWith('en'));
  if (ukVoice) u.voice = ukVoice;
  u.onend = onEnd;
  u.onerror = onEnd;
  window.speechSynthesis.speak(u);
}
