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
        className="w-full flex items-center justify-center gap-3 rounded-2xl border border-[var(--color-line)] bg-[var(--color-bg-card)] px-4 py-3 text-sm font-medium active:scale-[.99] transition"
        aria-label="Play morning briefing"
      >
        <span className="text-lg" aria-hidden>{state === 'speaking' ? '⏸' : '▶'}</span>
        <span>
          {state === 'idle' && 'Listen to today (20s)'}
          {state === 'loading' && 'Preparing…'}
          {state === 'speaking' && 'Listening… tap to stop'}
          {state === 'done' && 'Play again'}
          {state === 'error' && 'Try again'}
        </span>
      </button>
      {script && state !== 'idle' && (
        <p className="text-xs text-[var(--color-ink-faint)] mt-2 px-2">{script}</p>
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
