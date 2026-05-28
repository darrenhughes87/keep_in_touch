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
      className="animate-pop fixed bottom-24 left-1/2 z-50 -translate-x-1/2 rounded-full bg-[var(--color-ink)] px-5 py-2.5 text-sm text-[var(--color-bg)] shadow-[var(--shadow-pop)]"
    >
      {label}
    </div>
  );
}
