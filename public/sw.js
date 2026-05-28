// Keep In Touch — minimal service worker.
// v3 — stop precaching the icon so logo changes show up without a SW bump.
// The icon is tiny and served fast; let the browser HTTP-cache it instead.

const CACHE = 'kit-v3';
const STATIC = ['/manifest.webmanifest'];

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    // Cache each file individually; one missing file no longer fails install.
    await Promise.all(STATIC.map(async (url) => {
      try {
        const res = await fetch(url, { cache: 'no-cache' });
        if (res.ok) await cache.put(url, res);
      } catch (err) {
        // Swallow — the SW must still install and activate.
      }
    }));
    self.skipWaiting();
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  if (req.mode === 'navigate') {
    event.respondWith(fetch(req).catch(() => caches.match('/')));
    return;
  }
  if (STATIC.some(p => url.pathname === p)) {
    event.respondWith(caches.match(req).then(r => r || fetch(req)));
  }
});

self.addEventListener('push', (event) => {
  let title = 'A quiet nudge';
  let body = 'Someone you care about is drifting.';
  if (event.data) {
    try {
      const data = event.data.json();
      title = data.title || title;
      body = data.body || body;
    } catch {}
  }
  event.waitUntil(self.registration.showNotification(title, {
    body,
    icon: '/icon.svg',
    badge: '/icon.svg',
    tag: 'kit-daily',
  }));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(self.clients.openWindow('/'));
});
