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
      <main className="max-w-md mx-auto px-4 pb-24 pt-2">
        <section className="mt-4">
          <h2 className="text-xs uppercase tracking-wider text-[var(--color-ink-faint)] mb-2">This year</h2>
          <div className="bg-[var(--color-bg-card)] border border-[var(--color-line)] rounded-2xl p-5">
            <p className="text-3xl font-serif">{interactions.total}</p>
            <p className="text-sm text-[var(--color-ink-soft)]">reach-outs to {interactions.people} people</p>
          </div>
        </section>

        {topPeople.length > 0 && (
          <section className="mt-6">
            <h2 className="text-xs uppercase tracking-wider text-[var(--color-ink-faint)] mb-2">Most often</h2>
            <ul className="space-y-1">
              {topPeople.map(p => (
                <li key={p.id} className="flex justify-between bg-[var(--color-bg-card)] border border-[var(--color-line)] rounded-xl px-4 py-3 text-sm">
                  <span>{p.name}</span>
                  <span className="text-[var(--color-ink-faint)]">{p.count}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {moments.length > 0 && (
          <section className="mt-6">
            <h2 className="text-xs uppercase tracking-wider text-[var(--color-ink-faint)] mb-2">Moments</h2>
            <ul className="space-y-2">
              {moments.map(m => (
                <li key={m.id} className="bg-[var(--color-warm-soft)] rounded-xl px-3 py-2 text-sm">
                  <p>{m.body}</p>
                  <p className="text-xs text-[var(--color-ink-faint)] mt-1">{m.created_at.slice(0, 10)}</p>
                </li>
              ))}
            </ul>
          </section>
        )}

        {moments.length === 0 && interactions.total === 0 && (
          <p className="text-center text-[var(--color-ink-faint)] mt-12 text-sm">Nothing logged yet this year.</p>
        )}
      </main>
    </>
  );
}
