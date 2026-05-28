import { requireSession } from '@/lib/auth';
import { TopNav } from '@/components/TopNav';
import { searchNotes, searchMoments, listPeople } from '@/lib/queries';
import { humanDaysAgo } from '@/lib/time';
import Link from 'next/link';
import { PersonAvatar } from '@/components/PersonAvatar';

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  await requireSession();
  const sp = await searchParams;
  const q = (sp.q ?? '').trim();

  let notes: Awaited<ReturnType<typeof searchNotes>> = [];
  let moments: Awaited<ReturnType<typeof searchMoments>> = [];
  let people: ReturnType<typeof listPeople> = [];
  if (q) {
    try { notes = searchNotes(q); } catch { /* malformed FTS query */ }
    try { moments = searchMoments(q); } catch { /* malformed FTS query */ }
    people = listPeople({ search: q });
  }

  return (
    <>
      <TopNav title="Search" back="/" />
      <main className="max-w-md mx-auto px-4 pad-nav pt-2">
        <form action="/search" method="get" className="mt-2">
          <div className="relative">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--color-ink-ghost)]" aria-hidden>
              <circle cx="10.5" cy="10.5" r="6" stroke="currentColor" strokeWidth="1.6" />
              <path d="m15.5 15.5 4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
            <input name="q" defaultValue={q} autoFocus placeholder="Search names or notes…" className="w-full rounded-[var(--radius-lg)] border border-[var(--color-line)] bg-[var(--color-bg-card)] py-3 pl-11 pr-4 placeholder:text-[var(--color-ink-ghost)] shadow-[var(--shadow-card)]" />
          </div>
        </form>

        {q && (
          <>
            {people.length > 0 && (
              <section className="mt-6">
                <h2 className="eyebrow">People</h2>
                <ul className="overflow-hidden rounded-[var(--radius-card)] border border-[var(--color-line)] bg-[var(--color-bg-card)] shadow-[var(--shadow-card)] divide-y divide-[var(--color-line-soft)]">
                  {people.map(p => (
                    <li key={p.id}>
                      <Link href={`/people/${p.id}`} className="flex items-center gap-3 px-3.5 py-3 active:bg-[var(--color-bg-sunken)] transition-colors">
                        <PersonAvatar person={p} size={38} />
                        <span className="font-medium">{p.name}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {notes.length > 0 && (
              <section className="mt-6">
                <h2 className="eyebrow">Notes</h2>
                <ul className="space-y-2">
                  {notes.map(n => (
                    <li key={n.id}>
                      <Link href={`/people/${n.person_id}`} className="block rounded-[var(--radius-md)] border border-[var(--color-line)] bg-[var(--color-bg-card)] px-3.5 py-3 text-sm shadow-[var(--shadow-card)]">
                        <div className="text-xs text-[var(--color-ink-faint)]">{n.person_name} · {humanDaysAgo(n.created_at)}</div>
                        <div className="mt-1 leading-relaxed">{n.body}</div>
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {moments.length > 0 && (
              <section className="mt-6">
                <h2 className="eyebrow">Moments</h2>
                <ul className="space-y-2">
                  {moments.map(m => (
                    <li key={m.id} className="rounded-[var(--radius-md)] border border-[var(--color-warm-soft)] bg-[var(--color-warm-soft)] px-3.5 py-3 text-sm text-[var(--color-warm-ink)]">
                      <p className="leading-relaxed">{m.body}</p>
                      <p className="mt-1 text-xs opacity-70">{humanDaysAgo(m.created_at)}</p>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {people.length === 0 && notes.length === 0 && moments.length === 0 && (
              <p className="mt-10 text-center text-sm text-[var(--color-ink-faint)]">Nothing matches.</p>
            )}
          </>
        )}
      </main>
    </>
  );
}
