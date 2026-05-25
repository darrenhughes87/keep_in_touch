'use client';

import { useEffect, useRef, useState } from 'react';

interface Props {
  onSave: (body: string, source: 'voice' | 'text') => Promise<void>;
  placeholder?: string;
}

// Web Speech API typings
type SpeechRecognitionType = any;

export function VoiceNoteInput({ onSave, placeholder = 'Add a note. Tap the mic to dictate.' }: Props) {
  const [text, setText] = useState('');
  const [listening, setListening] = useState(false);
  const [supported, setSupported] = useState(false);
  const [saving, setSaving] = useState(false);
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

  const save = async () => {
    const body = text.trim();
    if (!body) return;
    setSaving(true);
    try {
      await onSave(body, wasVoice.current ? 'voice' : 'text');
      setText('');
      wasVoice.current = false;
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="border border-[var(--color-line)] rounded-2xl p-3 bg-[var(--color-bg-card)]">
      <textarea
        value={text}
        onChange={e => setText(e.target.value)}
        placeholder={placeholder}
        rows={3}
        className="w-full resize-none focus:outline-none bg-transparent text-[15px]"
      />
      <div className="flex items-center justify-between mt-2">
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
