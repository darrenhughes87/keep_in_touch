import { requireSession } from '@/lib/auth';
import { TopNav } from '@/components/TopNav';
import { searchNotes, listPeople } from '@/lib/queries';
import { humanDaysAgo } from '@/lib/time';
import Link from 'next/link';
import { PersonAvatar } from '@/components/PersonAvatar';

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  await requireSession();
  const sp = await searchParams;
  const q = (sp.q ?? '').trim();

  let notes: Awaited<ReturnType<typeof searchNotes>> = [];
  let people: ReturnType<typeof listPeople> = [];
  if (q) {
    try {
      notes = searchNotes(q);
    } catch { /* malformed FTS query, ignore */ }
    people = listPeople({ search: q });
  }

  return (
    <>
      <TopNav title="Search" back="/" />
      <main className="max-w-md mx-auto px-4 pb-24 pt-2">
        <form action="/search" method="get" className="mt-2">
          <input name="q" defaultValue={q} autoFocus placeholder="Search names or notes…" className="w-full px-4 py-3 rounded-xl border border-[var(--color-line)] bg-[var(--color-bg-card)]" />
        </form>

        {q && (
          <>
            {people.length > 0 && (
              <section className="mt-6">
                <h2 className="text-xs uppercase tracking-wider text-[var(--color-ink-faint)] mb-2">People</h2>
                <ul className="space-y-1">
                  {people.map(p => (
                    <li key={p.id}>
                      <Link href={`/people/${p.id}`} className="flex items-center gap-3 py-2 px-2 rounded-xl active:bg-stone-100">
                        <PersonAvatar person={p} size={36} />
                        <span>{p.name}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {notes.length > 0 && (
              <section className="mt-6">
                <h2 className="text-xs uppercase tracking-wider text-[var(--color-ink-faint)] mb-2">Notes</h2>
                <ul className="space-y-2">
                  {notes.map(n => (
                    <li key={n.id}>
                      <Link href={`/people/${n.person_id}`} className="block bg-[var(--color-bg-card)] border border-[var(--color-line)] rounded-xl px-3 py-2 text-sm">
                        <div className="text-[var(--color-ink-faint)] text-xs">{n.person_name} · {humanDaysAgo(n.created_at)}</div>
                        <div className="mt-0.5">{n.body}</div>
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {people.length === 0 && notes.length === 0 && (
              <p className="text-sm text-[var(--color-ink-faint)] mt-8 text-center">Nothing matches.</p>
            )}
          </>
        )}
      </main>
    </>
  );
}
