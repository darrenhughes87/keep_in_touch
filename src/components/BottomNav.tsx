'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

// Routes that should never show the tab bar (focused, full-screen flows).
const HIDDEN = ['/login', '/onboarding', '/share'];

type Tab = { href: string; label: string; icon: (active: boolean) => React.ReactNode };

const TABS: Tab[] = [
  {
    href: '/',
    label: 'Today',
    icon: (a) => (
      <svg viewBox="0 0 24 24" fill="none" width="22" height="22" aria-hidden>
        <path d="M3.5 11.3 12 4l8.5 7.3" stroke="currentColor" strokeWidth={a ? 2 : 1.6} strokeLinecap="round" strokeLinejoin="round" />
        <path d="M5.5 10v8.5a1 1 0 0 0 1 1h11a1 1 0 0 0 1-1V10" stroke="currentColor" strokeWidth={a ? 2 : 1.6} strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    href: '/people',
    label: 'People',
    icon: (a) => (
      <svg viewBox="0 0 24 24" fill="none" width="22" height="22" aria-hidden>
        <circle cx="9" cy="8" r="3.2" stroke="currentColor" strokeWidth={a ? 2 : 1.6} />
        <path d="M3.5 19c0-3 2.5-5 5.5-5s5.5 2 5.5 5" stroke="currentColor" strokeWidth={a ? 2 : 1.6} strokeLinecap="round" />
        <path d="M16 6.2a3 3 0 0 1 0 5.6M17.5 19c0-2.3-.9-3.8-2-4.6" stroke="currentColor" strokeWidth={a ? 2 : 1.6} strokeLinecap="round" />
      </svg>
    ),
  },
  {
    href: '/search',
    label: 'Search',
    icon: (a) => (
      <svg viewBox="0 0 24 24" fill="none" width="22" height="22" aria-hidden>
        <circle cx="10.5" cy="10.5" r="6" stroke="currentColor" strokeWidth={a ? 2 : 1.6} />
        <path d="m15.5 15.5 4 4" stroke="currentColor" strokeWidth={a ? 2 : 1.6} strokeLinecap="round" />
      </svg>
    ),
  },
  {
    href: '/settings',
    label: 'Settings',
    icon: (a) => (
      <svg viewBox="0 0 24 24" fill="none" width="22" height="22" aria-hidden>
        <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth={a ? 2 : 1.6} />
        <path d="M12 2.5v2.2M12 19.3v2.2M21.5 12h-2.2M4.7 12H2.5M18.5 5.5l-1.6 1.6M7.1 16.9l-1.6 1.6M18.5 18.5l-1.6-1.6M7.1 7.1 5.5 5.5" stroke="currentColor" strokeWidth={a ? 2 : 1.6} strokeLinecap="round" />
      </svg>
    ),
  },
];

export function BottomNav() {
  const pathname = usePathname() || '/';
  if (HIDDEN.some((h) => pathname === h || pathname.startsWith(h + '/'))) return null;

  return (
    <nav
      className="fixed bottom-0 inset-x-0 z-40 border-t border-[var(--color-line)] bg-[var(--color-bg)]/85 backdrop-blur-xl"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      aria-label="Primary"
    >
      <div className="max-w-md mx-auto grid grid-cols-4">
        {TABS.map((t) => {
          const active = t.href === '/' ? pathname === '/' : pathname.startsWith(t.href);
          return (
            <Link
              key={t.href}
              href={t.href}
              aria-current={active ? 'page' : undefined}
              className="flex flex-col items-center justify-center gap-1 py-2.5 transition-colors"
              style={{ color: active ? 'var(--color-accent-ink)' : 'var(--color-ink-faint)' }}
            >
              <span className={active ? 'scale-105 transition-transform' : 'transition-transform'}>
                {t.icon(active)}
              </span>
              <span className="text-[10px] font-medium tracking-wide">{t.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
