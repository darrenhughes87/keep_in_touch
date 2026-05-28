import { requireSession } from '@/lib/auth';
import { TopNav } from '@/components/TopNav';
import { listMoments, listPeople } from '@/lib/queries';
import { getDb } from '@/lib/db';

export default async function YearPage() {
  await requireSession();
  const year = new Date().getFullYear();
  const moments = listMoments(year);
  const interactions = getDb().prepare(`
    SELECT COUNT(DISTINCT person_id) as people, COUNT(*) as total
    FROM interactions WHERE happened_at LIKE ?
  `).get(`${year}-%`) as { people: number; total: number };

  const topPeople = getDb().prepare(`
    SELECT p.id, p.name, COUNT(i.id) as count
    FROM people p JOIN interactions i ON i.person_id = p.id
    WHERE i.happened_at LIKE ?
    GROUP BY p.id ORDER BY count DESC LIMIT 5
  `).all(`${year}-%`) as Array<{ id: number; name: string; count: number }>;

  return (
    <>
      <TopNav title={`${year}`} back="/settings" />
      <main className="max-w-md mx-auto px-4 pad-nav pt-2">
        <section className="mt-4">
          <h2 className="eyebrow">This year</h2>
          <div className="animate-rise rounded-[var(--radius-card)] border border-[var(--color-line)] bg-[var(--color-bg-card)] p-5 shadow-[var(--shadow-card)]">
            <p className="font-serif text-4xl font-medium tracking-tight">{interactions.total}</p>
            <p className="mt-0.5 text-sm text-[var(--color-ink-soft)]">reach-outs to {interactions.people} {interactions.people === 1 ? 'person' : 'people'}</p>
          </div>
        </section>

        {topPeople.length > 0 && (
          <section className="mt-7">
            <h2 className="eyebrow">Most often</h2>
            <ul className="overflow-hidden rounded-[var(--radius-card)] border border-[var(--color-line)] bg-[var(--color-bg-card)] shadow-[var(--shadow-card)] divide-y divide-[var(--color-line-soft)]">
              {topPeople.map(p => (
                <li key={p.id} className="flex justify-between px-4 py-3 text-sm">
                  <span className="font-medium">{p.name}</span>
                  <span className="text-[var(--color-ink-faint)]">{p.count}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {moments.length > 0 && (
          <section className="mt-7">
            <h2 className="eyebrow">Moments</h2>
            <ul className="space-y-2">
              {moments.map(m => (
                <li key={m.id} className="rounded-[var(--radius-md)] border border-[var(--color-warm-soft)] bg-[var(--color-warm-soft)] px-3.5 py-3 text-sm text-[var(--color-warm-ink)]">
                  <p className="leading-relaxed">{m.body}</p>
                  <p className="mt-1 text-xs opacity-70">{m.created_at.slice(0, 10)}</p>
                </li>
              ))}
            </ul>
          </section>
        )}

        {moments.length === 0 && interactions.total === 0 && (
          <p className="mt-14 text-center text-sm text-[var(--color-ink-faint)]">Nothing logged yet this year.</p>
        )}
      </main>
    </>
  );
}
