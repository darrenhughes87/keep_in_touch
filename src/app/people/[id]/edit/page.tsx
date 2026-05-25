import { requireSession } from '@/lib/auth';
import { TopNav } from '@/components/TopNav';
import { getPerson, updatePerson } from '@/lib/queries';
import { notFound, redirect } from 'next/navigation';
import type { Layer } from '@/lib/types';

export default async function EditPersonPage({ params }: { params: Promise<{ id: string }> }) {
  await requireSession();
  const { id } = await params;
  const pid = parseInt(id, 10);
  const person = getPerson(pid);
  if (!person) notFound();

  async function save(formData: FormData) {
    'use server';
    updatePerson(pid, {
      name: String(formData.get('name') ?? person!.name).trim(),
      nickname: (String(formData.get('nickname') ?? '') || null) as any,
      layer: String(formData.get('layer') ?? person!.layer) as Layer,
      cadence_days: parseInt(String(formData.get('cadence_days') ?? person!.cadence_days), 10),
      phone: (String(formData.get('phone') ?? '') || null) as any,
      whatsapp_phone: (String(formData.get('whatsapp_phone') ?? '') || null) as any,
      email: (String(formData.get('email') ?? '') || null) as any,
      birthday: (String(formData.get('birthday') ?? '') || null) as any,
      birthday_remind: formData.get('birthday_remind') === 'on' ? 1 : 0,
      how_we_met: (String(formData.get('how_we_met') ?? '') || null) as any,
      partner_kids: (String(formData.get('partner_kids') ?? '') || null) as any,
      notes_facts: (String(formData.get('notes_facts') ?? '') || null) as any,
    });
    redirect(`/people/${pid}`);
  }

  return (
    <>
      <TopNav title={`Edit ${person.name}`} back={`/people/${pid}`} />
      <main className="max-w-md mx-auto px-4 pb-24 pt-2">
        <form action={save} className="space-y-3 mt-2">
          <Field label="Name" name="name" defaultValue={person.name} required />
          <Field label="Nickname" name="nickname" defaultValue={person.nickname ?? ''} />
          <div>
            <label className="text-xs uppercase tracking-wider text-[var(--color-ink-faint)]">Layer</label>
            <select name="layer" defaultValue={person.layer} className="w-full mt-1 px-4 py-3 rounded-xl border border-[var(--color-line)] bg-[var(--color-bg-card)]">
              <option value="inner">Inner circle</option>
              <option value="close">Close friend</option>
              <option value="good">Good friend</option>
              <option value="acquaintance">Acquaintance</option>
            </select>
          </div>
          <Field label="Cadence (days)" name="cadence_days" type="number" defaultValue={String(person.cadence_days)} />
          <Field label="Phone" name="phone" inputMode="tel" defaultValue={person.phone ?? ''} />
          <Field label="WhatsApp number (if different)" name="whatsapp_phone" inputMode="tel" defaultValue={person.whatsapp_phone ?? ''} />
          <Field label="Email" name="email" type="email" defaultValue={person.email ?? ''} />
          <Field label="Birthday (MM-DD or YYYY-MM-DD)" name="birthday" defaultValue={person.birthday ?? ''} />
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="birthday_remind" defaultChecked={!!person.birthday_remind} />
            Remind me 3 days before
          </label>
          <Field label="Family (partner, kids)" name="partner_kids" defaultValue={person.partner_kids ?? ''} />
          <Field label="How we met" name="how_we_met" defaultValue={person.how_we_met ?? ''} />
          <div>
            <label className="text-xs uppercase tracking-wider text-[var(--color-ink-faint)]">Other notes</label>
            <textarea name="notes_facts" defaultValue={person.notes_facts ?? ''} rows={3} className="w-full mt-1 px-4 py-3 rounded-xl border border-[var(--color-line)] bg-[var(--color-bg-card)]" />
          </div>
          <button type="submit" className="w-full bg-[var(--color-ink)] text-white rounded-xl py-3 font-medium mt-4">
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
      <input name={name} {...rest} className="w-full mt-1 px-4 py-3 rounded-xl border border-[var(--color-line)] bg-[var(--color-bg-card)] focus:outline-none focus:border-[var(--color-accent)]" />
    </label>
  );
}
