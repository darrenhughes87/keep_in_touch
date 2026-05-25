'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

// Quiet "Saved" toast that fades in and out when ?saved=<ts> is in the URL.
// Server actions / save handlers redirect to ?saved=<Date.now()> so this
// fires once per save without persistent state.
export function SavedToast({ label = 'Saved' }: { label?: string }) {
  const sp = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const v = sp.get('saved');
    if (!v) return;
    setVisible(true);
    // Strip the query param so a refresh doesn't re-fire the toast.
    const cleanup = setTimeout(() => {
      router.replace(pathname, { scroll: false });
    }, 50);
    const hide = setTimeout(() => setVisible(false), 1800);
    return () => { clearTimeout(cleanup); clearTimeout(hide); };
  }, [sp, router, pathname]);

  if (!visible) return null;
  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-[var(--color-ink)] text-white px-5 py-2.5 rounded-full text-sm shadow-lg z-50 animate-[fadeIn_.15s_ease-out]"
      style={{ animation: 'fadeIn .15s ease-out' }}
    >
      {label}
    </div>
  );
}
