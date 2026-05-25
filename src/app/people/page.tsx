import { requireSession } from '@/lib/auth';
import { peopleWithMeta } from '@/lib/queries';
import { TopNav } from '@/components/TopNav';
import { PersonAvatar } from '@/components/PersonAvatar';
import { LayerPill } from '@/components/LayerPill';
import Link from 'next/link';
import { humanDaysAgo } from '@/lib/time';
import type { Layer } from '@/lib/types';

export default async function PeoplePage({ searchParams }: { searchParams: Promise<{ layer?: Layer; q?: string }> }) {
  await requireSession();
  const sp = await searchParams;
  const all = peopleWithMeta();

  const filtered = all.filter(p => {
    if (sp.layer && p.layer !== sp.layer) return false;
    if (sp.q && !`${p.name} ${p.nickname ?? ''}`.toLowerCase().includes(sp.q.toLowerCase())) return false;
    return true;
  }).sort((a, b) => {
    // sort by drift descending: highest days_since/cadence ratio first
    const ra = a.days_since == null ? Infinity : a.days_since / a.cadence_days;
    const rb = b.days_since == null ? Infinity : b.days_since / b.cadence_days;
    return rb - ra;
  });

  return (
    <>
      <TopNav title="People" back="/" />
      <main className="max-w-md mx-auto px-4 pb-24">
        <div className="flex items-center justify-end gap-3 mt-3 text-xs">
          <Link href="/import" className="text-[var(--color-accent)] underline-offset-2 hover:underline">
            Import from contacts
          </Link>
          <Link href="/people/new" className="text-[var(--color-accent)] underline-offset-2 hover:underline">
            Add manually
          </Link>
        </div>
        <form className="mt-3" action="/people" method="get">
          {sp.layer && <input type="hidden" name="layer" value={sp.layer} />}
          <input
            name="q"
            defaultValue={sp.q ?? ''}
            placeholder="Search names…"
            className="w-full px-4 py-3 rounded-xl border border-[var(--color-line)] bg-[var(--color-bg-card)]"
          />
        </form>

        <div className="flex gap-2 overflow-x-auto mt-3 -mx-1 px-1 pb-1">
          {(['all', 'inner', 'close', 'good', 'acquaintance'] as const).map(l => {
            const active = (sp.layer ?? 'all') === l;
            const href = l === 'all' ? '/people' : `/people?layer=${l}`;
            return (
              <Link key={l} href={href} className={`text-xs whitespace-nowrap px-3 py-1.5 rounded-full border ${active ? 'bg-[var(--color-ink)] text-white border-[var(--color-ink)]' : 'border-[var(--color-line)] text-[var(--color-ink-soft)]'}`}>
                {l === 'all' ? 'All' : l[0].toUpperCase() + l.slice(1)}
              </Link>
            );
          })}
        </div>

        <p className="text-xs text-[var(--color-ink-faint)] mt-3">{filtered.length} {filtered.length === 1 ? 'person' : 'people'}</p>

        <ul className="mt-2 space-y-1">
          {filtered.map(p => (
            <li key={p.id}>
              <Link href={`/people/${p.id}`} className="flex items-center gap-3 py-3 px-2 rounded-xl active:bg-stone-100">
                <PersonAvatar person={p} size={40} />
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{p.name}</div>
                  <div className="text-xs text-[var(--color-ink-faint)] mt-0.5">
                    {humanDaysAgo(p.last_contact)} · {p.layer}
                  </div>
                </div>
                {p.days_since != null && p.days_since > p.cadence_days * 1.5 && (
                  <span className="text-[10px] text-[var(--color-warm)]">drifting</span>
                )}
              </Link>
            </li>
          ))}
        </ul>

        {filtered.length === 0 && (
          <div className="text-center text-[var(--color-ink-faint)] mt-12">
            <p className="text-sm">No one matches.</p>
          </div>
        )}

        <div className="fixed bottom-6 right-6 z-20">
          <Link href="/people/new" className="bg-[var(--color-ink)] text-white rounded-full w-14 h-14 flex items-center justify-center text-2xl shadow-lg active:scale-95">
            +
          </Link>
        </div>
      </main>
    </>
  );
}
