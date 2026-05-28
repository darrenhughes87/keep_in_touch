import { requireSession } from '@/lib/auth';
import { TopNav } from '@/components/TopNav';
import { getSettings, updateSettings } from '@/lib/queries';
import Link from 'next/link';
import { haveAnthropicKey } from '@/lib/anthropic';
import { NotificationToggle } from '@/components/NotificationToggle';
import { ResyncCadenceButton } from '@/components/ResyncCadenceButton';
import { SavedToast } from '@/components/SavedToast';
import { redirect } from 'next/navigation';
import { Suspense } from 'react';

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
      default_country_code: String(formData.get('default_country_code') ?? '').trim(),
    });
    redirect(`/settings?saved=${Date.now()}`);
  }

  return (
    <>
      <TopNav title="Settings" back="/" />
      <Suspense fallback={null}><SavedToast /></Suspense>
      <main className="max-w-md mx-auto px-4 pad-nav pt-2">
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

          <Section title="Default country code">
            <p className="text-xs text-[var(--color-ink-faint)] mb-2">
              Used to fix phone numbers that don't already have one. UK is <code>+44</code>, US/Canada is <code>+1</code>, leave blank to disable. Applies to WhatsApp / Call / SMS links at the moment you tap them, so changing this fixes existing contacts instantly.
            </p>
            <input
              type="text"
              name="default_country_code"
              defaultValue={s.default_country_code}
              placeholder="+44"
              className="input w-32"
            />
          </Section>

          <Section title="Cadence defaults (days)">
            <p className="text-xs text-[var(--color-ink-faint)] mb-2">
              Days between contacts per layer. Used for new people, and when you promote someone to a different layer.
            </p>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Inner" name="cadence_inner" defaultValue={String(s.cadence_inner)} type="number" />
              <Field label="Close" name="cadence_close" defaultValue={String(s.cadence_close)} type="number" />
              <Field label="Good" name="cadence_good" defaultValue={String(s.cadence_good)} type="number" />
              <Field label="Acquaintance" name="cadence_acquaintance" defaultValue={String(s.cadence_acquaintance)} type="number" />
            </div>
            <ResyncCadenceButton />
          </Section>

          <Section title="Morning push (optional)">
            <NotificationToggle />
          </Section>

          <Section title="Moments (optional)">
            <label className="flex items-center gap-2"><input type="checkbox" name="moments_enabled" defaultChecked={!!s.moments_enabled} /> Ask me once a day if anything good happened</label>
          </Section>

          <button type="submit" className="w-full rounded-[var(--radius-md)] bg-[var(--color-ink)] py-3 font-medium text-[var(--color-bg)] active:scale-[.99] transition-transform">
            Save
          </button>
        </form>

        <hr className="my-8 border-[var(--color-line-soft)]" />

        <div className="overflow-hidden rounded-[var(--radius-card)] border border-[var(--color-line)] bg-[var(--color-bg-card)] shadow-[var(--shadow-card)] divide-y divide-[var(--color-line-soft)]">
          <LinkRow href="/import" title="Import contacts (vCard)" sub="Upload a .vcf from your phone, pick who to track." />
          <LinkRow href="/year" title="Year scroll" sub="Moments and reach-outs from this year." />
          <LinkRow href="/api/export" title="Export everything (JSON)" sub="Your full database. Save it somewhere safe." />
          <div className="px-4 py-3.5">
            <div className="font-medium">AI features</div>
            <div className="mt-1 text-xs leading-relaxed text-[var(--color-ink-faint)]">
              {haveAnthropicKey() ? '✓ Anthropic key detected — opener suggestions and briefings use Haiku.' : 'No Anthropic key set — opener suggestions and briefings use local templates.'}
            </div>
          </div>
        </div>

        <form action="/logout" method="POST">
          <button type="submit" className="block w-full py-5 text-center text-sm text-[var(--color-ink-faint)]">
            Log out
          </button>
        </form>
      </main>
    </>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="eyebrow">{title}</h2>
      <div className="rounded-[var(--radius-lg)] border border-[var(--color-line)] bg-[var(--color-bg-card)] p-3.5 shadow-[var(--shadow-card)]">{children}</div>
    </section>
  );
}

function LinkRow({ href, title, sub }: { href: string; title: string; sub: string }) {
  return (
    <Link href={href} className="flex items-center justify-between gap-3 px-4 py-3.5 active:bg-[var(--color-bg-sunken)] transition-colors">
      <div>
        <div className="font-medium">{title}</div>
        <div className="mt-0.5 text-xs text-[var(--color-ink-faint)]">{sub}</div>
      </div>
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" aria-hidden className="shrink-0 text-[var(--color-ink-ghost)]">
        <path d="m9.5 5 7 7-7 7" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </Link>
  );
}

function Field({ label, name, ...rest }: { label: string; name: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="block">
      <div className="text-[10px] uppercase tracking-wider text-[var(--color-ink-faint)]">{label}</div>
      <input name={name} {...rest} className="input mt-1 w-full" />
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
