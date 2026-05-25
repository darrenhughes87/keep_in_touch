import { requireSession } from '@/lib/auth';
import { TopNav } from '@/components/TopNav';
import { getSettings, updateSettings } from '@/lib/queries';
import { revalidatePath } from 'next/cache';
import Link from 'next/link';
import { haveAnthropicKey } from '@/lib/anthropic';
import { NotificationToggle } from '@/components/NotificationToggle';

export default async function SettingsPage() {
  await requireSession();
  const s = getSettings();

  async function save(formData: FormData) {
    'use server';
    updateSettings({
      greeting_tone: String(formData.get('greeting_tone') ?? 'warm') as any,
      digest_time: String(formData.get('digest_time') ?? '08:30'),
      digest_enabled: formData.get('digest_enabled') === 'on' ? 1 : 0,
      max_suggestions_per_day: parseInt(String(formData.get('max_suggestions_per_day') ?? '3'), 10),
      quiet_days: String(formData.get('quiet_days') ?? ''),
      moments_enabled: formData.get('moments_enabled') === 'on' ? 1 : 0,
      cadence_inner: parseInt(String(formData.get('cadence_inner') ?? '7'), 10),
      cadence_close: parseInt(String(formData.get('cadence_close') ?? '21'), 10),
      cadence_good: parseInt(String(formData.get('cadence_good') ?? '60'), 10),
      cadence_acquaintance: parseInt(String(formData.get('cadence_acquaintance') ?? '180'), 10),
    });
    revalidatePath('/settings');
  }

  return (
    <>
      <TopNav title="Settings" back="/" />
      <main className="max-w-md mx-auto px-4 pb-24 pt-2">
        <form action={save} className="space-y-5 mt-3">
          <Section title="Greeting">
            <select name="greeting_tone" defaultValue={s.greeting_tone} className="select">
              <option value="warm">Warm</option>
              <option value="neutral">Neutral</option>
              <option value="brief">Brief</option>
            </select>
          </Section>

          <Section title="Daily digest">
            <label className="flex items-center gap-2"><input type="checkbox" name="digest_enabled" defaultChecked={!!s.digest_enabled} /> Compute a fresh list each morning</label>
            <input type="time" name="digest_time" defaultValue={s.digest_time} className="input mt-2" />
          </Section>

          <Section title="Max suggestions per day">
            <input type="number" name="max_suggestions_per_day" min={1} max={5} defaultValue={s.max_suggestions_per_day} className="input w-24" />
          </Section>

          <Section title="Quiet days">
            <p className="text-xs text-[var(--color-ink-faint)] mb-2">Days when no suggestions surface. Tick the days you want left alone.</p>
            <QuietDays defaultCsv={s.quiet_days} />
          </Section>

          <Section title="Cadence defaults (days)">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Inner" name="cadence_inner" defaultValue={String(s.cadence_inner)} type="number" />
              <Field label="Close" name="cadence_close" defaultValue={String(s.cadence_close)} type="number" />
              <Field label="Good" name="cadence_good" defaultValue={String(s.cadence_good)} type="number" />
              <Field label="Acquaintance" name="cadence_acquaintance" defaultValue={String(s.cadence_acquaintance)} type="number" />
            </div>
          </Section>

          <Section title="Morning push (optional)">
            <NotificationToggle />
          </Section>

          <Section title="Moments (optional)">
            <label className="flex items-center gap-2"><input type="checkbox" name="moments_enabled" defaultChecked={!!s.moments_enabled} /> Ask me once a day if anything good happened</label>
          </Section>

          <button type="submit" className="w-full bg-[var(--color-ink)] text-white rounded-xl py-3 font-medium">
            Save
          </button>
        </form>

        <hr className="my-8 border-[var(--color-line)]" />

        <div className="space-y-3">
          <Link href="/import" className="block bg-[var(--color-bg-card)] border border-[var(--color-line)] rounded-xl p-4">
            <div className="font-medium">Import contacts (vCard)</div>
            <div className="text-xs text-[var(--color-ink-faint)] mt-1">Upload a .vcf from your phone, pick who to track.</div>
          </Link>
          <Link href="/year" className="block bg-[var(--color-bg-card)] border border-[var(--color-line)] rounded-xl p-4">
            <div className="font-medium">Year scroll</div>
            <div className="text-xs text-[var(--color-ink-faint)] mt-1">Moments and reach-outs from this year.</div>
          </Link>
          <Link href="/api/export" className="block bg-[var(--color-bg-card)] border border-[var(--color-line)] rounded-xl p-4">
            <div className="font-medium">Export everything (JSON)</div>
            <div className="text-xs text-[var(--color-ink-faint)] mt-1">Your full database. Save it somewhere safe.</div>
          </Link>
          <div className="block bg-[var(--color-bg-card)] border border-[var(--color-line)] rounded-xl p-4">
            <div className="font-medium">AI features</div>
            <div className="text-xs text-[var(--color-ink-faint)] mt-1">
              {haveAnthropicKey() ? '✓ Anthropic key detected — opener suggestions and briefings use Haiku.' : 'No Anthropic key set — opener suggestions and briefings use local templates.'}
            </div>
          </div>
          <Link href="/logout" className="block text-center text-sm text-[var(--color-ink-faint)] py-4">Log out</Link>
        </div>
      </main>
    </>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-xs uppercase tracking-wider text-[var(--color-ink-faint)] mb-2">{title}</h2>
      <div className="bg-[var(--color-bg-card)] border border-[var(--color-line)] rounded-xl p-3">{children}</div>
    </section>
  );
}

function Field({ label, name, ...rest }: { label: string; name: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="block">
      <div className="text-[10px] uppercase tracking-wider text-[var(--color-ink-faint)]">{label}</div>
      <input name={name} {...rest} className="w-full mt-1 px-3 py-2 rounded-lg border border-[var(--color-line)] bg-white" />
    </label>
  );
}

function QuietDays({ defaultCsv }: { defaultCsv: string }) {
  const set = new Set(defaultCsv.split(',').filter(Boolean));
  // Render a hidden input that's updated via small uncontrolled approach: just render checkboxes named quiet_days_X
  // But to keep a single 'quiet_days' CSV value, use a tiny client form helper.
  return (
    <div className="grid grid-cols-7 gap-1">
      {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map((d, i) => (
        <label key={d} className="text-center text-xs">
          <input type="checkbox" className="quiet-day" data-i={i} defaultChecked={set.has(String(i))} />
          <div>{d}</div>
        </label>
      ))}
      <input type="hidden" name="quiet_days" defaultValue={defaultCsv} id="quiet-days-hidden" />
      <script dangerouslySetInnerHTML={{ __html: `
        document.querySelectorAll('.quiet-day').forEach(el => {
          el.addEventListener('change', () => {
            const csv = Array.from(document.querySelectorAll('.quiet-day'))
              .filter(x => x.checked)
              .map(x => x.dataset.i)
              .join(',');
            document.getElementById('quiet-days-hidden').value = csv;
          });
        });
      ` }} />
    </div>
  );
}
