'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const STEPS = ['Welcome', 'Inner circle', 'Close friends', 'Phones', 'Start'] as const;

export function OnboardingFlow() {
  const [step, setStep] = useState(0);
  const [innerList, setInnerList] = useState('');
  const [closeList, setCloseList] = useState('');
  const [phoneMap, setPhoneMap] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  const innerNames = innerList.split('\n').map(s => s.trim()).filter(Boolean);
  const closeNames = closeList.split('\n').map(s => s.trim()).filter(Boolean);
  const allNames = [...innerNames, ...closeNames];

  async function finish() {
    setSaving(true);
    const people = [
      ...innerNames.map(name => ({ name, layer: 'inner' as const, phone: phoneMap[name] || null })),
      ...closeNames.map(name => ({ name, layer: 'close' as const, phone: phoneMap[name] || null })),
    ];
    await fetch('/api/onboard', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ people }),
    });
    router.replace('/');
  }

  return (
    <main className="min-h-screen flex items-start justify-center p-6 pt-12">
      <div className="w-full max-w-md space-y-6">
        <div className="flex gap-1.5">
          {STEPS.map((_, i) => (
            <div key={i} className={`h-1 flex-1 rounded-full ${i <= step ? 'bg-[var(--color-ink)]' : 'bg-[var(--color-line)]'}`} />
          ))}
        </div>

        {step === 0 && (
          <div>
            <h1 className="text-3xl font-serif tracking-tight">Keep In Touch</h1>
            <p className="mt-4 text-[var(--color-ink-soft)]">
              This is just for you. Nobody else sees what's in here.
            </p>
            <p className="mt-3 text-[var(--color-ink-soft)]">
              Its only job is to surface the right name at the right time, so it's easier to stay close to the people you care about.
            </p>
            <p className="mt-3 text-[var(--color-ink-soft)]">
              Two short steps and we're in.
            </p>
            <button onClick={() => setStep(1)} className="mt-8 w-full bg-[var(--color-ink)] text-white rounded-xl py-3 font-medium">
              Start
            </button>
          </div>
        )}

        {step === 1 && (
          <div>
            <h2 className="text-xl font-medium">Who are the five or so people you'd be devastated to lose touch with?</h2>
            <p className="text-sm text-[var(--color-ink-soft)] mt-2">One name per line. Just first names is fine.</p>
            <textarea
              value={innerList}
              onChange={e => setInnerList(e.target.value)}
              rows={7}
              autoFocus
              placeholder={'One name per line…'}
              className="w-full mt-3 px-4 py-3 rounded-xl border border-[var(--color-line)] bg-[var(--color-bg-card)] focus:outline-none focus:border-[var(--color-accent)]"
            />
            <div className="flex gap-2 mt-4">
              <button onClick={() => setStep(0)} className="px-4 py-3 rounded-xl text-[var(--color-ink-soft)]">Back</button>
              <button onClick={() => setStep(2)} disabled={innerNames.length === 0} className="flex-1 bg-[var(--color-ink)] text-white rounded-xl py-3 font-medium disabled:opacity-30">
                Next
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div>
            <h2 className="text-xl font-medium">Who are the people you'd love to see more of?</h2>
            <p className="text-sm text-[var(--color-ink-soft)] mt-2">Up to fifteen-ish. Good friends, old mates, family beyond your inner circle.</p>
            <textarea
              value={closeList}
              onChange={e => setCloseList(e.target.value)}
              rows={9}
              autoFocus
              placeholder={'One name per line…'}
              className="w-full mt-3 px-4 py-3 rounded-xl border border-[var(--color-line)] bg-[var(--color-bg-card)] focus:outline-none focus:border-[var(--color-accent)]"
            />
            <div className="flex gap-2 mt-4">
              <button onClick={() => setStep(1)} className="px-4 py-3 rounded-xl text-[var(--color-ink-soft)]">Back</button>
              <button onClick={() => setStep(3)} className="flex-1 bg-[var(--color-ink)] text-white rounded-xl py-3 font-medium">
                Next
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div>
            <h2 className="text-xl font-medium">Numbers (optional)</h2>
            <p className="text-sm text-[var(--color-ink-soft)] mt-2">Skip any you don't have to hand. You can fill them in later. Include country code (e.g. +44).</p>
            <div className="space-y-2 mt-4 max-h-80 overflow-y-auto">
              {allNames.map(n => (
                <label key={n} className="flex items-center gap-3">
                  <span className="w-24 text-sm truncate">{n}</span>
                  <input
                    type="tel"
                    inputMode="tel"
                    placeholder="+44…"
                    value={phoneMap[n] ?? ''}
                    onChange={e => setPhoneMap({ ...phoneMap, [n]: e.target.value })}
                    className="flex-1 px-3 py-2 rounded-lg border border-[var(--color-line)] bg-[var(--color-bg-card)]"
                  />
                </label>
              ))}
            </div>
            <div className="flex gap-2 mt-4">
              <button onClick={() => setStep(2)} className="px-4 py-3 rounded-xl text-[var(--color-ink-soft)]">Back</button>
              <button onClick={() => setStep(4)} className="flex-1 bg-[var(--color-ink)] text-white rounded-xl py-3 font-medium">
                Next
              </button>
            </div>
          </div>
        )}

        {step === 4 && (
          <div>
            <h2 className="text-xl font-medium">Ready.</h2>
            <p className="mt-3 text-[var(--color-ink-soft)]">
              You've added {allNames.length} {allNames.length === 1 ? 'person' : 'people'}. From tomorrow morning, the home screen will surface up to three names a day.
            </p>
            <p className="mt-3 text-[var(--color-ink-soft)]">
              No streaks, no nagging. If you ignore the app for a week, nothing breaks.
            </p>
            <p className="mt-3 text-[var(--color-ink-soft)]">
              Tip: after your next chat with anyone, jot one line so future-you has something real to lead with.
            </p>
            <button onClick={finish} disabled={saving} className="mt-8 w-full bg-[var(--color-ink)] text-white rounded-xl py-3 font-medium disabled:opacity-30">
              {saving ? 'Setting up…' : 'Open the app'}
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
