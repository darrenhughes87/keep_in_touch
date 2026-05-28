import { requireSession } from '@/lib/auth';
import { TopNav } from '@/components/TopNav';
import { createPerson, getSettings } from '@/lib/queries';
import { redirect } from 'next/navigation';
import type { Layer } from '@/lib/types';

export default async function NewPersonPage() {
  await requireSession();
  const s = getSettings();

  async function add(formData: FormData) {
    'use server';
    const name = String(formData.get('name') ?? '').trim();
    if (!name) return;
    const layer = (String(formData.get('layer') ?? 'close') as Layer);
    const p = createPerson({
      name,
      layer,
      nickname: String(formData.get('nickname') ?? '') || null,
      phone: String(formData.get('phone') ?? '') || null,
      email: String(formData.get('email') ?? '') || null,
      birthday: String(formData.get('birthday') ?? '') || null,
      how_we_met: String(formData.get('how_we_met') ?? '') || null,
    });
    redirect(`/people/${p.id}`);
  }

  return (
    <>
      <TopNav title="Add someone" back="/people" />
      <main className="max-w-md mx-auto px-4 pad-nav pt-2">
        <form action={add} className="space-y-4 mt-2">
          <Field label="Name" name="name" required autoFocus />
          <Field label="Nickname (optional)" name="nickname" />

          <div>
            <label className="text-xs uppercase tracking-wider text-[var(--color-ink-faint)]">Layer</label>
            <div className="grid grid-cols-2 gap-2 mt-2">
              {([
                ['inner', 'Inner circle', `every ~${s.cadence_inner}d`],
                ['close', 'Close friend', `every ~${s.cadence_close}d`],
                ['good', 'Good friend', `every ~${s.cadence_good}d`],
                ['acquaintance', 'Acquaintance', `every ~${s.cadence_acquaintance}d`],
              ] as const).map(([v, label, sub]) => (
                <label key={v} className="cursor-pointer rounded-[var(--radius-md)] border border-[var(--color-line)] bg-[var(--color-bg-card)] p-3 transition-colors has-[:checked]:border-[var(--color-accent)] has-[:checked]:bg-[var(--color-accent-soft)]">
                  <input type="radio" name="layer" value={v} defaultChecked={v === 'close'} className="hidden" />
                  <div className="text-sm font-medium">{label}</div>
                  <div className="text-xs text-[var(--color-ink-faint)]">{sub}</div>
                </label>
              ))}
            </div>
          </div>

          <Field label="Phone (with country code)" name="phone" inputMode="tel" placeholder="+447700900123" />
          <Field label="Email" name="email" type="email" />
          <Field label="Birthday (MM-DD or YYYY-MM-DD)" name="birthday" placeholder="03-14" />
          <Field label="How you met (optional)" name="how_we_met" />

          <button type="submit" className="mt-4 w-full rounded-[var(--radius-md)] bg-[var(--color-ink)] py-3 font-medium text-[var(--color-bg)] active:scale-[.99] transition-transform">
            Save
          </button>
        </form>
      </main>
    </>
  );
}

function Field({ label, name, ...rest }: { label: string; name: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="block">
      <div className="text-xs uppercase tracking-wider text-[var(--color-ink-faint)]">{label}</div>
      <input
        name={name}
        {...rest}
        className="w-full mt-1 px-4 py-3 rounded-xl border border-[var(--color-line)] bg-[var(--color-bg-card)] focus:outline-none focus:border-[var(--color-accent)]"
      />
    </label>
  );
}
