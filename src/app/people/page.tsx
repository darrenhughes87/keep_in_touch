import { requireSession } from '@/lib/auth';
import { peopleWithMeta } from '@/lib/queries';
import { TopNav } from '@/components/TopNav';
import { PersonAvatar } from '@/components/PersonAvatar';
import Link from 'next/link';
import { humanDaysAgo } from '@/lib/time';
import type { Layer } from '@/lib/types';

export default async function PeoplePage({ searchParams }: { searchParams: Promise<{ layer?: Layer; q?: string; starred?: string }> }) {
  await requireSession();
  const sp = await searchParams;
  const all = peopleWithMeta();

  // Note-aware search: also include people whose notes match the query.
  const { listPeople } = await import('@/lib/queries');
  const noteHits = sp.q ? new Set(listPeople({ search: sp.q }).map(p => p.id)) : null;

  const filtered = all.filter(p => {
    if (sp.layer && p.layer !== sp.layer) return false;
    if (sp.starred === '1' && !p.starred) return false;
    if (sp.q) {
      const hay = `${p.name} ${p.nickname ?? ''}`.toLowerCase();
      const matchesName = hay.includes(sp.q.toLowerCase());
      const matchesNote = noteHits?.has(p.id) ?? false;
      if (!matchesName && !matchesNote) return false;
    }
    return true;
  }).sort((a, b) => {
    if (!!a.starred !== !!b.starred) return a.starred ? 1 : -1;
    const ra = a.days_since == null ? Infinity : a.days_since / a.cadence_days;
    const rb = b.days_since == null ? Infinity : b.days_since / b.cadence_days;
    return rb - ra;
  });

  const filters = ['all', 'inner', 'close', 'good', 'acquaintance'] as const;

  return (
    <>
      <TopNav title="People" back="/" />
      <main className="max-w-md mx-auto px-4 pad-nav pt-3">
        {/* Search */}
        <form action="/people" method="get">
          {sp.layer && <input type="hidden" name="layer" value={sp.layer} />}
          <div className="relative">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--color-ink-ghost)]" aria-hidden>
              <circle cx="10.5" cy="10.5" r="6" stroke="currentColor" strokeWidth="1.6" />
              <path d="m15.5 15.5 4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
            <input
              name="q"
              defaultValue={sp.q ?? ''}
              placeholder="Search names or memories…"
              className="w-full rounded-[var(--radius-lg)] border border-[var(--color-line)] bg-[var(--color-bg-card)] py-3 pl-11 pr-4 placeholder:text-[var(--color-ink-ghost)] shadow-[var(--shadow-card)]"
            />
          </div>
        </form>

        {/* Filter chips */}
        <div className="mt-3 -mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none]">
          {filters.map(l => {
            const active = (sp.layer ?? 'all') === l && sp.starred !== '1';
            const href = l === 'all' ? '/people' : `/people?layer=${l}`;
            return (
              <Chip key={l} href={href} active={active}>
                {l === 'all' ? 'Everyone' : l[0].toUpperCase() + l.slice(1)}
              </Chip>
            );
          })}
          <Chip href="/people?starred=1" active={sp.starred === '1'} star>
            ★ Starred
          </Chip>
        </div>

        <p className="mt-4 px-1 text-xs text-[var(--color-ink-faint)]">
          {filtered.length} {filtered.length === 1 ? 'person' : 'people'}
        </p>

        <ul className="mt-1.5 divide-y divide-[var(--color-line-soft)] overflow-hidden rounded-[var(--radius-card)] border border-[var(--color-line)] bg-[var(--color-bg-card)] shadow-[var(--shadow-card)]">
          {filtered.map(p => {
            const drifting = !p.starred && p.days_since != null && p.days_since > p.cadence_days * 1.5;
            return (
              <li key={p.id}>
                <Link href={`/people/${p.id}`} className="flex items-center gap-3 px-3.5 py-3 active:bg-[var(--color-bg-sunken)] transition-colors">
                  <PersonAvatar person={p} size={44} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 truncate">
                      {p.starred && <span className="text-[var(--color-star)] text-sm" aria-label="starred">★</span>}
                      <span className="truncate font-medium">{p.name}</span>
                    </div>
                    <div className="mt-0.5 text-xs text-[var(--color-ink-faint)]">
                      {humanDaysAgo(p.last_contact)} · {p.layer}
                    </div>
                  </div>
                  {drifting && (
                    <span className="rounded-full bg-[var(--color-warm-soft)] px-2 py-0.5 text-[10px] font-medium text-[var(--color-warm-ink)]">
                      drifting
                    </span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>

        {filtered.length === 0 && (
          <div className="mt-14 text-center text-[var(--color-ink-faint)]">
            <p className="text-sm">No one matches.</p>
            <div className="mt-5 flex justify-center gap-4 text-sm">
              <Link href="/import" className="text-[var(--color-accent-ink)] underline-offset-4 hover:underline">Import contacts</Link>
              <Link href="/people/new" className="text-[var(--color-accent-ink)] underline-offset-4 hover:underline">Add manually</Link>
            </div>
          </div>
        )}

        {filtered.length > 0 && (
          <div className="mt-5 flex justify-center">
            <Link href="/import" className="text-xs text-[var(--color-ink-faint)] underline-offset-4 hover:underline">
              Import from contacts
            </Link>
          </div>
        )}
      </main>

      {/* FAB — sits above the tab bar */}
      <Link
        href="/people/new"
        aria-label="Add person"
        className="fixed right-5 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-[var(--color-accent)] text-white shadow-[var(--shadow-raised)] active:scale-95 transition-transform"
        style={{ bottom: 'calc(5.5rem + env(safe-area-inset-bottom))' }}
      >
        <svg viewBox="0 0 24 24" width="26" height="26" fill="none" aria-hidden>
          <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </Link>
    </>
  );
}

function Chip({ href, active, star, children }: { href: string; active: boolean; star?: boolean; children: React.ReactNode }) {
  const base = 'whitespace-nowrap rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors';
  const cls = active
    ? star
      ? 'border-[var(--color-star)] bg-[var(--color-star)] text-white'
      : 'border-[var(--color-ink)] bg-[var(--color-ink)] text-white'
    : 'border-[var(--color-line)] bg-[var(--color-bg-card)] text-[var(--color-ink-soft)]';
  return <Link href={href} className={`${base} ${cls}`}>{children}</Link>;
}
