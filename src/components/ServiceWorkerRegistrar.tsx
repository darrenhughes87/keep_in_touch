'use client';

import { useEffect } from 'react';

export function ServiceWorkerRegistrar() {
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;
    // Eager register; log loudly on failure so we don't silently end up
    // in a "checking forever" state on the Settings push toggle.
    navigator.serviceWorker
      .register('/sw.js', { scope: '/' })
      .then(reg => {
        if (reg.installing) console.info('[sw] installing');
        else if (reg.waiting) console.info('[sw] waiting');
        else if (reg.active) console.info('[sw] active');
      })
      .catch(err => console.error('[sw] register failed', err));
  }, []);
  return null;
}
