'use client';

import { useEffect, useRef, useState } from 'react';

interface Props {
  onSave: (body: string, source: 'voice' | 'text') => Promise<void>;
  placeholder?: string;
}

type SpeechRecognitionType = any;

export function VoiceNoteInput({ onSave, placeholder = 'Add a note. Tap the mic to dictate.' }: Props) {
  const [text, setText] = useState('');
  const [listening, setListening] = useState(false);
  const [supported, setSupported] = useState(false);
  const [saving, setSaving] = useState(false);
  const [polishing, setPolishing] = useState(false);
  const [aiAvailable, setAiAvailable] = useState(false);
  const [previousText, setPreviousText] = useState<string | null>(null); // for undo of polish
  const recRef = useRef<SpeechRecognitionType | null>(null);
  const wasVoice = useRef(false);

  useEffect(() => {
    const SR: any = (typeof window !== 'undefined') &&
      ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);
    setSupported(!!SR);
    if (SR) {
      const r = new SR();
      r.continuous = true;
      r.interimResults = true;
      r.lang = 'en-GB';
      r.onresult = (e: any) => {
        let interim = '';
        let final = '';
        for (let i = e.resultIndex; i < e.results.length; i++) {
          const t = e.results[i][0].transcript;
          if (e.results[i].isFinal) final += t;
          else interim += t;
        }
        setText(prev => (final ? (prev + final + ' ') : prev) + interim);
      };
      r.onerror = () => setListening(false);
      r.onend = () => setListening(false);
      recRef.current = r;
    }

    // Check if Polish is available (Anthropic key configured server-side)
    fetch('/api/clean-note').then(r => r.json()).then(d => setAiAvailable(!!d.available)).catch(() => {});
  }, []);

  const toggle = () => {
    if (!recRef.current) return;
    if (listening) {
      recRef.current.stop();
      setListening(false);
    } else {
      wasVoice.current = true;
      try {
        recRef.current.start();
        setListening(true);
      } catch { /* already started */ }
    }
  };

  const polish = async () => {
    if (!text.trim() || polishing) return;
    setPolishing(true);
    setPreviousText(text);
    try {
      const r = await fetch('/api/clean-note', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body: text }),
      });
      const data = await r.json();
      if (data.cleaned) setText(data.cleaned);
    } catch { /* ignore, leave text as is */ }
    finally { setPolishing(false); }
  };

  const undoPolish = () => {
    if (previousText !== null) {
      setText(previousText);
      setPreviousText(null);
    }
  };

  const save = async () => {
    const body = text.trim();
    if (!body) return;
    setSaving(true);
    try {
      await onSave(body, wasVoice.current ? 'voice' : 'text');
      setText('');
      setPreviousText(null);
      wasVoice.current = false;
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-[var(--radius-lg)] border border-[var(--color-line)] bg-[var(--color-bg-card)] p-3.5 shadow-[var(--shadow-card)] focus-within:border-[var(--color-accent-line)] transition-colors">
      <textarea
        value={text}
        onChange={e => { setText(e.target.value); setPreviousText(null); }}
        placeholder={placeholder}
        rows={3}
        className="w-full resize-none bg-transparent text-[15px] leading-relaxed focus:outline-none placeholder:text-[var(--color-ink-ghost)]"
      />
      <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {supported ? (
            <button
              onClick={toggle}
              type="button"
              className={`flex items-center gap-1.5 rounded-[var(--radius-md)] px-3 py-2 text-sm font-medium transition-colors ${listening ? 'bg-[var(--color-warm-soft)] text-[var(--color-warm-ink)]' : 'bg-[var(--color-bg-sunken)] text-[var(--color-ink-soft)]'}`}
              aria-label={listening ? 'Stop dictation' : 'Start dictation'}
            >
              {listening ? (
                <><span className="h-2 w-2 animate-pulse rounded-full bg-[var(--color-warm)]" /> recording</>
              ) : (
                <>
                  <svg viewBox="0 0 24 24" width="15" height="15" fill="none" aria-hidden>
                    <rect x="9" y="3" width="6" height="11" rx="3" stroke="currentColor" strokeWidth="1.6" />
                    <path d="M6 11a6 6 0 0 0 12 0M12 17v3.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                  </svg>
                  dictate
                </>
              )}
            </button>
          ) : (
            <span className="text-xs text-[var(--color-ink-faint)]">Voice not supported in this browser</span>
          )}
          {aiAvailable && text.trim() && (
            previousText !== null ? (
              <button
                onClick={undoPolish}
                type="button"
                className="rounded-[var(--radius-md)] bg-[var(--color-bg-sunken)] px-3 py-2 text-sm font-medium text-[var(--color-ink-soft)]"
                title="Restore the original text"
              >
                ↶ undo
              </button>
            ) : (
              <button
                onClick={polish}
                type="button"
                disabled={polishing}
                className="flex items-center gap-1.5 rounded-[var(--radius-md)] bg-[var(--color-accent-soft)] px-3 py-2 text-sm font-medium text-[var(--color-accent-ink)] disabled:opacity-50"
                title="Clean up rambling and distill the meaning. British English."
              >
                <svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor" aria-hidden>
                  <path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5L12 3Z" />
                  <path d="M18 14l.8 2.2L21 17l-2.2.8L18 20l-.8-2.2L15 17l2.2-.8L18 14Z" />
                </svg>
                {polishing ? 'Polishing…' : 'polish'}
              </button>
            )
          )}
        </div>
        <button
          onClick={save}
          disabled={!text.trim() || saving}
          className="rounded-[var(--radius-md)] bg-[var(--color-ink)] px-4 py-2 text-sm font-medium text-[var(--color-bg)] disabled:opacity-30"
        >
          {saving ? 'Saving…' : 'Save'}
        </button>
      </div>
    </div>
  );
}
