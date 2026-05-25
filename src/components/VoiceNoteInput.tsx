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
    <div className="border border-[var(--color-line)] rounded-2xl p-3 bg-[var(--color-bg-card)]">
      <textarea
        value={text}
        onChange={e => { setText(e.target.value); setPreviousText(null); }}
        placeholder={placeholder}
        rows={3}
        className="w-full resize-none focus:outline-none bg-transparent text-[15px]"
      />
      <div className="flex items-center justify-between mt-2 gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          {supported ? (
            <button
              onClick={toggle}
              type="button"
              className={`px-3 py-2 rounded-xl text-sm font-medium ${listening ? 'bg-[var(--color-warm-soft)] text-[var(--color-warm)]' : 'bg-stone-100 text-[var(--color-ink-soft)]'}`}
              aria-label={listening ? 'Stop dictation' : 'Start dictation'}
            >
              {listening ? '● recording' : '🎙 dictate'}
            </button>
          ) : (
            <span className="text-xs text-[var(--color-ink-faint)]">Voice not supported in this browser</span>
          )}
          {aiAvailable && text.trim() && (
            previousText !== null ? (
              <button
                onClick={undoPolish}
                type="button"
                className="px-3 py-2 rounded-xl text-sm font-medium bg-stone-100 text-[var(--color-ink-soft)]"
                title="Restore the original text"
              >
                ↶ undo
              </button>
            ) : (
              <button
                onClick={polish}
                type="button"
                disabled={polishing}
                className="px-3 py-2 rounded-xl text-sm font-medium bg-[var(--color-accent-soft)] text-[var(--color-accent)] disabled:opacity-50"
                title="Clean up rambling and distill the meaning. British English."
              >
                {polishing ? 'Polishing…' : '✨ polish'}
              </button>
            )
          )}
        </div>
        <button
          onClick={save}
          disabled={!text.trim() || saving}
          className="px-4 py-2 rounded-xl text-sm font-medium bg-[var(--color-ink)] text-white disabled:opacity-30"
        >
          {saving ? 'Saving…' : 'Save'}
        </button>
      </div>
    </div>
  );
}
