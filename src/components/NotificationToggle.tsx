'use client';

import { useEffect, useState } from 'react';

type State = 'loading' | 'unavailable' | 'denied' | 'no-sw' | 'off' | 'on' | 'busy';

// 5s ceiling on the SW-ready wait so the UI never hangs forever if the
// worker silently failed to register (happens on some Android Chrome PWA
// re-installs, with TLS-terminating proxies, or non-standard ports).
function readyWithTimeout(): Promise<ServiceWorkerRegistration | null> {
  return Promise.race([
    navigator.serviceWorker.ready,
    new Promise<null>(resolve => setTimeout(() => resolve(null), 5000)),
  ]) as Promise<ServiceWorkerRegistration | null>;
}

export function NotificationToggle() {
  const [state, setState] = useState<State>('loading');
  const [reason, setReason] = useState<string | null>(null);

  useEffect(() => { void check(); }, []);

  async function check() {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator) || !('PushManager' in window)) {
      setState('unavailable');
      setReason('This browser does not support push notifications.');
      return;
    }
    const keyRes = await fetch('/api/push/vapid-key').then(r => r.json()).catch(() => ({ available: false }));
    if (!keyRes.available) {
      setState('unavailable');
      setReason('Push is not configured on the server. Run `pnpm vapid` and add the keys to .env.');
      return;
    }
    if (Notification.permission === 'denied') {
      setState('denied');
      return;
    }

    // Is there ANY registration at all? If not, the SW never installed —
    // surface a button to install it now rather than hanging on `ready`.
    const existing = await navigator.serviceWorker.getRegistration();
    if (!existing) {
      setState('no-sw');
      return;
    }

    const reg = await readyWithTimeout();
    if (!reg) {
      setState('no-sw');
      return;
    }
    const sub = await reg.pushManager.getSubscription();
    setState(sub ? 'on' : 'off');
  }

  async function installSw() {
    setState('busy');
    setReason(null);
    try {
      // First, sanity-check that the sw.js file is actually served.
      const probe = await fetch('/sw.js', { cache: 'no-store' });
      if (!probe.ok) {
        setReason(`The service worker file isn't reachable (HTTP ${probe.status}). Check your reverse proxy / Tailscale Serve config.`);
        setState('no-sw');
        return;
      }
      const ct = probe.headers.get('content-type') || '';
      if (!/javascript/i.test(ct)) {
        setReason(`sw.js is being served with the wrong Content-Type (got "${ct}", expected JavaScript).`);
        setState('no-sw');
        return;
      }

      const reg = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
      // Wait for activation. ready resolves only once SOME registration is active.
      // We also explicitly wait for our specific registration to reach 'activated'.
      if (reg.installing) {
        await new Promise<void>(resolve => {
          const w = reg.installing!;
          w.addEventListener('statechange', () => {
            if (w.state === 'activated' || w.state === 'redundant') resolve();
          });
        });
      }
      const ready = await readyWithTimeout();
      if (!ready) {
        setReason('Service worker registered but never activated within 5 seconds. Try reloading the page.');
        setState('no-sw');
        return;
      }
      const sub = await ready.pushManager.getSubscription();
      setState(sub ? 'on' : 'off');
    } catch (err: any) {
      console.error('SW install failed', err);
      setReason(`Install failed: ${err?.message ?? String(err)}`);
      setState('no-sw');
    }
  }

  async function enable() {
    setState('busy');
    try {
      const perm = await Notification.requestPermission();
      if (perm !== 'granted') {
        setState('denied');
        return;
      }
      const keyRes = await fetch('/api/push/vapid-key').then(r => r.json());
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(keyRes.key) as BufferSource,
      });
      await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sub.toJSON()),
      });
      setState('on');
    } catch (err) {
      console.error('enable push failed', err);
      setState('off');
    }
  }

  async function disable() {
    setState('busy');
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await fetch('/api/push/unsubscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ endpoint: sub.endpoint }),
        });
        await sub.unsubscribe();
      }
      setState('off');
    } catch {
      setState('on'); // revert
    }
  }

  if (state === 'loading') {
    return <p className="text-xs text-[var(--color-ink-faint)]">Checking…</p>;
  }
  if (state === 'unavailable') {
    return <p className="text-xs text-[var(--color-ink-faint)]">{reason}</p>;
  }
  if (state === 'denied') {
    return (
      <p className="text-xs text-[var(--color-ink-faint)]">
        Notifications are blocked in your browser settings. Allow them for this site to enable.
      </p>
    );
  }
  if (state === 'no-sw') {
    return (
      <div className="space-y-2">
        <p className="text-xs text-[var(--color-ink-faint)]">
          {reason ?? "Background service isn't running yet. Tap below to install, then turn on push."}
        </p>
        <button
          type="button"
          onClick={installSw}
          className="px-3 py-1.5 rounded-full text-xs font-medium bg-stone-100 text-[var(--color-ink-soft)]"
        >
          {reason ? 'Try again' : 'Install background service'}
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-start justify-between gap-3">
      <div className="text-sm text-[var(--color-ink-soft)]">
        {state === 'on'
          ? 'You will get one soft push in the morning if anyone is drifting. Empty days are silent.'
          : 'One push in the morning if anyone is drifting. Off the rest of the day. Empty days stay silent.'}
      </div>
      <button
        type="button"
        onClick={state === 'on' ? disable : enable}
        disabled={state === 'busy'}
        className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium ${
          state === 'on'
            ? 'bg-[var(--color-good)] text-white'
            : 'bg-stone-100 text-[var(--color-ink-soft)]'
        }`}
      >
        {state === 'busy' ? '…' : state === 'on' ? 'On' : 'Turn on'}
      </button>
    </div>
  );
}

function urlBase64ToUint8Array(base64: string): Uint8Array {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4);
  const b64 = (base64 + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(b64);
  // Allocate via ArrayBuffer to avoid Uint8Array<SharedArrayBuffer> inference.
  const buf = new ArrayBuffer(raw.length);
  const arr = new Uint8Array(buf);
  for (let i = 0; i < raw.length; ++i) arr[i] = raw.charCodeAt(i);
  return arr;
}
