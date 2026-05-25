'use client';

import type { Person } from '@/lib/types';
import { normalisePhone } from '@/lib/phone';

async function logTap(personId: number, channel: string) {
  try {
    await fetch(`/api/people/${personId}/interactions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ channel, origin: 'button_tap' }),
    });
  } catch {
    /* offline-tolerant */
  }
}

export function ContactButtons({ person, compact = false, onAct, countryCode = '' }: { person: Person; compact?: boolean; onAct?: () => void; countryCode?: string }) {
  const wa = normalisePhone(person.whatsapp_phone || person.phone || '', countryCode);
  // For tel: / sms: keep the user-friendly form too — but if we have a normalised
  // international number, prefer that since most dialers handle it.
  const tel = normalisePhone(person.phone || person.whatsapp_phone || '', countryCode);
  const email = person.email || '';

  const waHref = wa ? `https://wa.me/${wa}` : '';
  const smsHref = tel ? `sms:+${tel}` : '';
  const callHref = tel ? `tel:+${tel}` : '';
  const mailHref = email ? `mailto:${email}` : '';

  const baseBtn = compact
    ? 'flex-1 text-center px-3 py-3 rounded-xl text-sm font-medium bg-[var(--color-bg-card)] border border-[var(--color-line)] active:bg-stone-100'
    : 'flex-1 text-center px-3 py-3 rounded-xl text-sm font-medium bg-[var(--color-bg-card)] border border-[var(--color-line)] active:scale-[.98] transition';

  return (
    <div className="grid grid-cols-4 gap-2">
      <a
        href={waHref || '#'}
        target="_blank"
        rel="noreferrer"
        onClick={() => { if (wa) { logTap(person.id, 'whatsapp'); onAct?.(); } }}
        aria-disabled={!wa}
        className={`${baseBtn} ${wa ? '' : 'opacity-40 pointer-events-none'}`}
      >
        <div className="text-lg">💬</div>
        <div className="text-[11px] mt-1 text-[var(--color-ink-soft)]">WhatsApp</div>
      </a>
      <a
        href={callHref || '#'}
        onClick={() => { if (tel) { logTap(person.id, 'call'); onAct?.(); } }}
        aria-disabled={!tel}
        className={`${baseBtn} ${tel ? '' : 'opacity-40 pointer-events-none'}`}
      >
        <div className="text-lg">📞</div>
        <div className="text-[11px] mt-1 text-[var(--color-ink-soft)]">Call</div>
      </a>
      <a
        href={smsHref || '#'}
        onClick={() => { if (tel) { logTap(person.id, 'sms'); onAct?.(); } }}
        aria-disabled={!tel}
        className={`${baseBtn} ${tel ? '' : 'opacity-40 pointer-events-none'}`}
      >
        <div className="text-lg">💭</div>
        <div className="text-[11px] mt-1 text-[var(--color-ink-soft)]">SMS</div>
      </a>
      <a
        href={mailHref || '#'}
        onClick={() => { if (email) { logTap(person.id, 'email'); onAct?.(); } }}
        aria-disabled={!email}
        className={`${baseBtn} ${email ? '' : 'opacity-40 pointer-events-none'}`}
      >
        <div className="text-lg">✉️</div>
        <div className="text-[11px] mt-1 text-[var(--color-ink-soft)]">Email</div>
      </a>
    </div>
  );
}
