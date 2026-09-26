// FIELDGUARD service worker: caches the app shell so the site opens with no signal.
const CACHE = 'fieldguard-v1';
const FONT_HOSTS = ['fonts.googleapis.com', 'fonts.gstatic.com'];

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    const shell = await fetch('./index.html', { cache: 'no-store' }).then(r => r.text());
    const assets = [...shell.matchAll(/(?:src|href)="\.?\/?(assets\/[^"]+)"/g)].map(m => m[1]);
    await cache.addAll(['./', './index.html', './manifest.webmanifest', './icon.svg', ...assets]);
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)));
    await self.clients.claim();
  })());
});

// Network first, fall back to cache when offline.
self.addEventListener('fetch', event => {
  const req = event.request;
  const url = new URL(req.url);
  if (req.method !== 'GET' || (url.origin !== self.location.origin && !FONT_HOSTS.includes(url.hostname))) return;
  event.respondWith((async () => {
    try {
      const res = await fetch(req);
      if (res.ok || res.type === 'opaque') {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(req, copy));
      }
      return res;
    } catch {
      const cached = await caches.match(req);
      if (cached) return cached;
      if (req.mode === 'navigate') return (await caches.match('./index.html')) || Response.error();
      return Response.error();
    }
  })());
});
