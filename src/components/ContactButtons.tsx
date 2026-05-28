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

  const baseBtn =
    'flex flex-col items-center justify-center gap-1.5 py-2.5 rounded-[var(--radius-md)] bg-[var(--color-bg-sunken)] border border-[var(--color-line)] text-[var(--color-ink-soft)] active:scale-[.97] transition-transform';

  return (
    <div className="grid grid-cols-4 gap-2">
      <a
        href={waHref || '#'}
        target="_blank"
        rel="noreferrer"
        onClick={() => { if (wa) { logTap(person.id, 'whatsapp'); onAct?.(); } }}
        aria-disabled={!wa}
        aria-label="WhatsApp"
        className={`${baseBtn} ${wa ? '' : 'opacity-35 pointer-events-none'}`}
      >
        <Icon><path d="M12 3a9 9 0 0 0-7.7 13.6L3 21l4.5-1.2A9 9 0 1 0 12 3Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" /><path d="M9 9.2c0-.4.3-.7.7-.6.3 0 .5.2.7.6l.5 1.1c.1.3 0 .6-.2.8l-.3.3c.4.8 1 1.4 1.8 1.8l.3-.3c.2-.2.5-.3.8-.2l1.1.5c.4.2.6.4.6.7.1.9-.7 1.5-1.5 1.4-2.7-.3-4.6-2.2-4.9-4.9Z" fill="currentColor" /></Icon>
        <span className="text-[10px] font-medium">WhatsApp</span>
      </a>
      <a
        href={callHref || '#'}
        onClick={() => { if (tel) { logTap(person.id, 'call'); onAct?.(); } }}
        aria-disabled={!tel}
        aria-label="Call"
        className={`${baseBtn} ${tel ? '' : 'opacity-35 pointer-events-none'}`}
      >
        <Icon><path d="M6.5 4h2.2l1.3 3.3-1.6 1.2a10 10 0 0 0 4.8 4.8l1.2-1.6 3.3 1.3v2.2a1.8 1.8 0 0 1-2 1.8A13 13 0 0 1 4.7 6a1.8 1.8 0 0 1 1.8-2Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" /></Icon>
        <span className="text-[10px] font-medium">Call</span>
      </a>
      <a
        href={smsHref || '#'}
        onClick={() => { if (tel) { logTap(person.id, 'sms'); onAct?.(); } }}
        aria-disabled={!tel}
        aria-label="Text message"
        className={`${baseBtn} ${tel ? '' : 'opacity-35 pointer-events-none'}`}
      >
        <Icon><path d="M5 5h14a1.5 1.5 0 0 1 1.5 1.5v8A1.5 1.5 0 0 1 19 16h-7l-4 3v-3H5a1.5 1.5 0 0 1-1.5-1.5v-8A1.5 1.5 0 0 1 5 5Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" /></Icon>
        <span className="text-[10px] font-medium">SMS</span>
      </a>
      <a
        href={mailHref || '#'}
        onClick={() => { if (email) { logTap(person.id, 'email'); onAct?.(); } }}
        aria-disabled={!email}
        aria-label="Email"
        className={`${baseBtn} ${email ? '' : 'opacity-35 pointer-events-none'}`}
      >
        <Icon><rect x="3.5" y="5.5" width="17" height="13" rx="1.6" stroke="currentColor" strokeWidth="1.6" /><path d="m4.5 7 7.5 5.2L19.5 7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></Icon>
        <span className="text-[10px] font-medium">Email</span>
      </a>
    </div>
  );
}

function Icon({ children }: { children: React.ReactNode }) {
  return (
    <svg viewBox="0 0 24 24" width="21" height="21" fill="none" aria-hidden>
      {children}
    </svg>
  );
}
