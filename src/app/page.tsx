import { requireSession } from '@/lib/auth';
import { getOrComputeSuggestions, getSettings, getPerson, latestNote, lastContact, birthdaysSoon, hasMomentToday } from '@/lib/queries';
import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { TopNav } from '@/components/TopNav';
import { SuggestionCard } from '@/components/SuggestionCard';
import { BriefingButton } from '@/components/BriefingButton';
import { MomentPrompt } from '@/components/MomentPrompt';
import Link from 'next/link';

const GREETINGS = {
  warm: ['Morning.', 'Hey.', 'Hello you.', 'Quiet morning?', 'Hi.'],
  neutral: ['Today.', 'Morning.', 'Hello.'],
  brief: ['Today.'],
};

export default async function Home() {
  await requireSession();
  const settings = getSettings();
  if (!settings.onboarded) redirect('/onboarding');

  const suggestions = getOrComputeSuggestions();
  const bdays = birthdaysSoon(7);
  const greet = pick(GREETINGS[settings.greeting_tone] || GREETINGS.warm);
  const showMomentPrompt = !!settings.moments_enabled && !hasMomentToday() && isEvening();

  const cards = suggestions.map(s => {
    const person = getPerson(s.person_id);
    if (!person) return null;
    const lc = lastContact(s.person_id);
    const ds = lc ? Math.floor((Date.now() - new Date(lc).getTime()) / 86_400_000) : null;
    const ln = latestNote(s.person_id);
    return { id: s.id, person, daysSince: ds, latestNote: ln ?? null };
  }).filter(Boolean) as Array<{ id: number; person: NonNullable<ReturnType<typeof getPerson>>; daysSince: number | null; latestNote: ReturnType<typeof latestNote> | null }>;

  return (
    <>
      <TopNav />
      <main className="max-w-md mx-auto px-4 pb-24 pt-2">
        <div className="py-6">
          <p className="text-2xl font-serif tracking-tight">{greet}</p>
          <p className="text-sm text-[var(--color-ink-soft)] mt-1">
            {cards.length === 0
              ? "You're all caught up. Have a good day."
              : cards.length === 1
              ? "One name today, if you've got a spare minute."
              : `${cards.length} people, if you've got a spare ten minutes.`}
          </p>
        </div>

        {cards.length > 0 && <BriefingButton />}

        <div className="space-y-3 mt-2">
          {cards.map(c => (
            <SuggestionCard
              key={c.id}
              suggestionId={c.id}
              person={c.person}
              daysSince={c.daysSince}
              latestNote={c.latestNote as any}
              countryCode={settings.default_country_code}
            />
          ))}
        </div>

        {bdays.length > 0 && (
          <section className="mt-8">
            <h2 className="text-xs uppercase tracking-wider text-[var(--color-ink-faint)] mb-3">Birthdays this week</h2>
            <div className="space-y-2">
              {bdays.map(b => (
                <Link key={b.id} href={`/people/${b.id}`} className="block bg-[var(--color-warm-soft)] text-[var(--color-warm)] rounded-2xl px-4 py-3 text-sm">
                  🎂 {b.name}
                </Link>
              ))}
            </div>
          </section>
        )}

        {cards.length === 0 && (
          <div className="mt-12 text-center text-[var(--color-ink-faint)]">
            <p className="text-4xl">🌿</p>
            <p className="mt-3 text-sm">Nothing pressing today.</p>
            <Link href="/people" className="inline-block mt-6 text-sm text-[var(--color-accent)] underline-offset-2 hover:underline">
              Browse everyone
            </Link>
          </div>
        )}

        {showMomentPrompt && <MomentPrompt />}
      </main>
    </>
  );
}

function pick<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)]; }
function isEvening(): boolean {
  const h = new Date().getHours();
  return h >= 19 || h <= 2;
}
