import { requireSession } from '@/lib/auth';
import { getOrComputeSuggestions, getSettings, getPerson, latestNote, lastContact, birthdaysSoon, hasMomentToday, listMoments, starsNeedingCheckIn, followUpsDue } from '@/lib/queries';
import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { TopNav } from '@/components/TopNav';
import { SuggestionCard } from '@/components/SuggestionCard';
import { BriefingButton } from '@/components/BriefingButton';
import { MomentPrompt } from '@/components/MomentPrompt';
import { StarCheckIn } from '@/components/StarCheckIn';
import Link from 'next/link';

// Time-neutral greetings. The app might be opened at any hour.
const GREETINGS = {
  warm: ['Hey.', 'Hello you.', 'Hi.', 'Hi there.'],
  neutral: ['Hello.', 'Hi.'],
  brief: ['Hi.'],
};

export default async function Home() {
  await requireSession();
  const settings = getSettings();
  if (!settings.onboarded) redirect('/onboarding');

  const suggestions = getOrComputeSuggestions();
  const followUps = followUpsDue();
  const bdays = birthdaysSoon(7);
  const starCheckIns = starsNeedingCheckIn(30, 1); // one at a time, soft
  const greet = pick(GREETINGS[settings.greeting_tone] || GREETINGS.warm);
  const showMomentPrompt = !!settings.moments_enabled && !hasMomentToday() && isEvening();
  // Small footer link to Year scroll when there's anything to look back at.
  const recentMoments = settings.moments_enabled ? listMoments().slice(0, 1) : [];

  // De-dupe: if a person has a follow-up due, skip them in the normal
  // suggestion section (they get their own "Follow up" card above).
  const followUpIds = new Set(followUps.map(p => p.id));
  const cards = suggestions.filter(s => !followUpIds.has(s.person_id)).map(s => {
    const person = getPerson(s.person_id);
    if (!person) return null;
    const lc = lastContact(s.person_id);
    const ds = lc ? Math.floor((Date.now() - new Date(lc).getTime()) / 86_400_000) : null;
    const ln = latestNote(s.person_id);
    return { id: s.id, person, daysSince: ds, latestNote: ln ?? null };
  }).filter(Boolean) as Array<{ id: number; person: NonNullable<ReturnType<typeof getPerson>>; daysSince: number | null; latestNote: ReturnType<typeof latestNote> | null }>;

  const followUpCards = followUps.map(person => {
    const lc = lastContact(person.id);
    const ds = lc ? Math.floor((Date.now() - new Date(lc).getTime()) / 86_400_000) : null;
    const ln = latestNote(person.id);
    return { person, daysSince: ds, latestNote: ln ?? null };
  });

  return (
    <>
      <TopNav />
      <main className="max-w-md mx-auto px-4 pad-nav pt-2">
        <div className="animate-rise py-6">
          <p className="font-serif text-[28px] font-medium leading-tight tracking-tight">{greet}</p>
          <p className="mt-1.5 text-sm text-[var(--color-ink-soft)]">
            {cards.length === 0
              ? "You're all caught up. Have a good day."
              : cards.length === 1
              ? "One name today, if you've got a spare minute."
              : `${cards.length} people, if you've got a spare ten minutes.`}
          </p>
        </div>

        {starCheckIns.map(p => (
          <StarCheckIn key={p.id} person={p} />
        ))}

        {followUpCards.length > 0 && (
          <section className="mb-4">
            <h2 className="text-xs uppercase tracking-wider text-[var(--color-ink-faint)] mb-2">You wanted to check in</h2>
            <div className="space-y-3">
              {followUpCards.map(c => (
                <SuggestionCard
                  key={`fu-${c.person.id}`}
                  suggestionId={-c.person.id /* synthetic, won't match daily_suggestions */}
                  person={c.person}
                  daysSince={c.daysSince}
                  latestNote={c.latestNote as any}
                  countryCode={settings.default_country_code}
                  followUpDue
                />
              ))}
            </div>
          </section>
        )}

        {(cards.length > 0 || followUpCards.length > 0) && <BriefingButton />}

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
            <h2 className="mb-2.5 px-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--color-ink-faint)]">Birthdays this week</h2>
            <div className="space-y-2">
              {bdays.map(b => (
                <Link
                  key={b.id}
                  href={`/people/${b.id}`}
                  className="flex items-center gap-3 rounded-[var(--radius-lg)] border border-[var(--color-warm-soft)] bg-[var(--color-warm-soft)] px-4 py-3 text-sm text-[var(--color-warm-ink)] active:scale-[.99] transition-transform"
                >
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" aria-hidden className="shrink-0">
                    <path d="M5 13h14v6a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1v-6Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
                    <path d="M4 13a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2M12 11V7M12 7a1.4 1.4 0 1 1 0-2.8c.6 0 .9.5.9 1.1 0 .9-.9 1.7-.9 1.7Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <span className="font-medium">{b.name}</span>
                </Link>
              ))}
            </div>
          </section>
        )}

        {cards.length === 0 && (
          <div className="mt-14 flex flex-col items-center text-center text-[var(--color-ink-faint)]">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--color-good-soft)] text-[var(--color-good)]">
              <svg viewBox="0 0 24 24" width="30" height="30" fill="none" aria-hidden>
                <path d="M12 20s7-3.5 7-9.5A4.5 4.5 0 0 0 12 7a4.5 4.5 0 0 0-7 3.5C5 16.5 12 20 12 20Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
              </svg>
            </div>
            <p className="mt-4 text-sm">Nothing pressing today.</p>
            <Link href="/people" className="mt-5 text-sm text-[var(--color-accent-ink)] underline-offset-4 hover:underline">
              Browse everyone
            </Link>
          </div>
        )}

        {showMomentPrompt && <MomentPrompt />}

        {recentMoments.length > 0 && (
          <div className="text-center mt-10">
            <Link href="/year" className="text-xs text-[var(--color-ink-faint)] underline-offset-2 hover:underline">
              Look back at your moments
            </Link>
          </div>
        )}
      </main>
    </>
  );
}

function pick<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)]; }
function isEvening(): boolean {
  const h = new Date().getHours();
  return h >= 19 || h <= 2;
}
