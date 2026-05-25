import { requireSession } from '@/lib/auth';
import { TopNav } from '@/components/TopNav';
import { getPerson, listNotes, listInteractions, lastContact } from '@/lib/queries';
import { notFound } from 'next/navigation';
import { PersonAvatar } from '@/components/PersonAvatar';
import { PhotoUploader } from '@/components/PhotoUploader';
import { LayerPill } from '@/components/LayerPill';
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
  const lc = lastContact(pid);
  const daysSince = lc ? Math.floor((Date.now() - new Date(lc).getTime()) / 86_400_000) : null;
  const bday = daysUntilBirthday(person.birthday);

  return (
    <>
      <TopNav title={person.name} back="/people" />
      <main className="max-w-md mx-auto px-4 pb-32">
        <div className="flex items-center gap-4 py-5">
          <PhotoUploader person={person} size={72} />
          <div className="min-w-0 flex-1">
            <h1 className="text-xl font-medium truncate">{person.name}</h1>
            {person.nickname && <p className="text-sm text-[var(--color-ink-faint)]">"{person.nickname}"</p>}
            <div className="mt-1 flex items-center gap-2 flex-wrap">
              <LayerPill layer={person.layer} />
              <span className="text-xs text-[var(--color-ink-faint)]">every ~{person.cadence_days}d</span>
            </div>
          </div>
        </div>

        <p className="text-sm text-[var(--color-ink-soft)]">
          Last contact: <span className="text-[var(--color-ink)]">{humanDaysAgo(lc)}</span>
          {bday !== null && bday <= 30 && (
            <span className="ml-2 text-[var(--color-warm)]">· 🎂 in {bday}d</span>
          )}
          {person.snoozed_until && new Date(person.snoozed_until) > new Date() && (
            <span className="ml-2 text-[var(--color-ink-faint)]">· snoozed</span>
          )}
        </p>

        <div className="mt-4">
          <ContactButtons person={person} />
        </div>

        <OpenerButton personId={person.id} personName={person.name} />

        <NoteSection personId={person.id} initialNotes={notes} />

        {(person.partner_kids || person.how_we_met || person.notes_facts) && (
          <section className="mt-6">
            <h2 className="text-xs uppercase tracking-wider text-[var(--color-ink-faint)] mb-2">Facts</h2>
            <dl className="bg-[var(--color-bg-card)] rounded-2xl border border-[var(--color-line)] divide-y divide-[var(--color-line)] text-sm">
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
          <section className="mt-6">
            <h2 className="text-xs uppercase tracking-wider text-[var(--color-ink-faint)] mb-2">Recent contact</h2>
            <ul className="space-y-1 text-sm text-[var(--color-ink-soft)]">
              {interactions.map(i => (
                <li key={i.id} className="flex justify-between">
                  <span>{i.channel}</span>
                  <span className="text-[var(--color-ink-faint)]">{humanDaysAgo(i.happened_at)}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        <PersonActions person={person} />

        <div className="text-center mt-10">
          <Link href={`/people/${person.id}/edit`} className="text-sm text-[var(--color-ink-faint)] underline-offset-2 hover:underline">
            Edit details
          </Link>
        </div>
      </main>
    </>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="px-4 py-3 flex gap-3">
      <dt className="w-24 text-[var(--color-ink-faint)] text-xs uppercase tracking-wider">{label}</dt>
      <dd className="flex-1">{children}</dd>
    </div>
  );
}
