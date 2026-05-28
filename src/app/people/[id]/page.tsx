import { requireSession } from '@/lib/auth';
import { TopNav } from '@/components/TopNav';
import { getPerson, listNotes, listInteractions, lastContact, getSettings } from '@/lib/queries';
import { notFound } from 'next/navigation';
import { PhotoUploader } from '@/components/PhotoUploader';
import { SavedToast } from '@/components/SavedToast';
import { StarToggle } from '@/components/StarToggle';
import { FollowUpScheduler } from '@/components/FollowUpScheduler';
import { Suspense } from 'react';
import { LayerPill } from '@/components/LayerPill';
import { LayerPicker } from '@/components/LayerPicker';
import { ContactButtons } from '@/components/ContactButtons';
import { NoteSection } from '@/components/NoteSection';
import { OpenerButton } from '@/components/OpenerButton';
import { PersonActions } from '@/components/PersonActions';
import { humanDaysAgo, daysUntilBirthday } from '@/lib/time';
import Link from 'next/link';

export default async function PersonPage({ params }: { params: Promise<{ id: string }> }) {
  await requireSession();
  const { id } = await params;
  const pid = parseInt(id, 10);
  const person = getPerson(pid);
  if (!person) notFound();

  const notes = listNotes(pid);
  const interactions = listInteractions(pid, 12);
  const settings = getSettings();
  const lc = lastContact(pid);
  const bday = daysUntilBirthday(person.birthday);
  const snoozed = person.snoozed_until && new Date(person.snoozed_until) > new Date();

  return (
    <>
      <TopNav title={person.name} back="/people" />
      <Suspense fallback={null}><SavedToast /></Suspense>
      <main className="max-w-md mx-auto px-4 pad-nav">

        {/* Identity card */}
        <section className="mt-3 rounded-[var(--radius-card)] border border-[var(--color-line)] bg-[var(--color-bg-card)] p-5 shadow-[var(--shadow-card)] animate-rise">
          <div className="flex items-start gap-4">
            <PhotoUploader person={person} size={76} />
            <div className="min-w-0 flex-1">
              <div className="flex items-start gap-2">
                <h1 className="flex-1 truncate font-serif text-[22px] font-medium leading-tight">{person.name}</h1>
                <StarToggle personId={person.id} starred={!!person.starred} firstName={person.name.split(' ')[0]} />
              </div>
              {person.nickname && <p className="text-sm text-[var(--color-ink-faint)]">“{person.nickname}”</p>}
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <LayerPill layer={person.layer} />
                <span className="text-xs text-[var(--color-ink-faint)]">
                  {person.starred ? 'starred · skipping suggestions' : `every ~${person.cadence_days}d`}
                </span>
              </div>
              <LayerPicker personId={person.id} current={person.layer} />
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-x-2 gap-y-1 border-t border-[var(--color-line-soft)] pt-3 text-sm text-[var(--color-ink-soft)]">
            <span>Last contact: <span className="text-[var(--color-ink)]">{humanDaysAgo(lc)}</span></span>
            {bday !== null && bday <= 30 && <span className="text-[var(--color-warm-ink)]">· 🎂 in {bday}d</span>}
            {snoozed && <span className="text-[var(--color-ink-faint)]">· snoozed</span>}
          </div>
        </section>

        {/* Reach out */}
        <section className="mt-5">
          <ContactButtons person={person} countryCode={settings.default_country_code} />
          <OpenerButton personId={person.id} personName={person.name} />
        </section>

        <FollowUpScheduler person={person} />

        <NoteSection personId={person.id} initialNotes={notes} />

        {(person.partner_kids || person.how_we_met || person.notes_facts || person.birthday || person.phone || person.email) && (
          <section className="mt-7">
            <SectionLabel>Facts</SectionLabel>
            <dl className="divide-y divide-[var(--color-line-soft)] overflow-hidden rounded-[var(--radius-card)] border border-[var(--color-line)] bg-[var(--color-bg-card)] text-sm shadow-[var(--shadow-card)]">
              {person.partner_kids && <Row label="Family">{person.partner_kids}</Row>}
              {person.how_we_met && <Row label="How we met">{person.how_we_met}</Row>}
              {person.notes_facts && <Row label="Notes">{person.notes_facts}</Row>}
              {person.birthday && <Row label="Birthday">{person.birthday}</Row>}
              {person.phone && <Row label="Phone">{person.phone}</Row>}
              {person.email && <Row label="Email">{person.email}</Row>}
            </dl>
          </section>
        )}

        {interactions.length > 0 && (
          <section className="mt-7">
            <SectionLabel>Recent contact</SectionLabel>
            <ul className="divide-y divide-[var(--color-line-soft)] overflow-hidden rounded-[var(--radius-card)] border border-[var(--color-line)] bg-[var(--color-bg-card)] text-sm shadow-[var(--shadow-card)]">
              {interactions.map(i => (
                <li key={i.id} className="flex justify-between px-4 py-2.5 text-[var(--color-ink-soft)]">
                  <span>{interactionLabel(i.channel, i.origin)}</span>
                  <span className="text-[var(--color-ink-faint)]">{humanDaysAgo(i.happened_at)}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        <PersonActions person={person} />

        <div className="mt-9 text-center">
          <Link href={`/people/${person.id}/edit`} className="text-sm text-[var(--color-ink-faint)] underline-offset-4 hover:underline">
            Edit details
          </Link>
        </div>
      </main>
    </>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <h2 className="mb-2.5 px-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--color-ink-faint)]">{children}</h2>;
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-3 px-4 py-3">
      <dt className="w-24 shrink-0 text-[11px] uppercase tracking-wider text-[var(--color-ink-faint)]">{label}</dt>
      <dd className="flex-1 text-[var(--color-ink)]">{children}</dd>
    </div>
  );
}

function interactionLabel(channel: string, origin: string): string {
  if (origin === 'manual_log') return 'chat logged';
  switch (channel) {
    case 'whatsapp':  return 'WhatsApp';
    case 'sms':       return 'SMS';
    case 'call':      return 'call';
    case 'email':     return 'email';
    case 'in_person': return 'met up';
    default:          return 'chat';
  }
}
