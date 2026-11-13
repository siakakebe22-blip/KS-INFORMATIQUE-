
const CACHE_NAME = 'ks-informatique-v4';

const APP_ROOT = self.registration.scope;
const HOME_URL = APP_ROOT;
const INDEX_URL = new URL('index.html', APP_ROOT).href;

const SUPABASE_CDN =
  'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';

self.addEventListener('install', event => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);

      await cache.addAll([
        HOME_URL,
        INDEX_URL,
        SUPABASE_CDN
      ]);

      await self.skipWaiting();
    })()
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key =>
            key.startsWith('ks-informatique-') &&
            key !== CACHE_NAME
          )
          .map(key => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const request = event.request;

  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  if (
    url.href === SUPABASE_CDN ||
    url.origin === self.location.origin
  ) {
    event.respondWith(
      (async () => {
        const cache = await caches.open(CACHE_NAME);
        const saved = await cache.match(request);

        if (saved) return saved;

        try {
          const response = await fetch(request);

          if (response.ok) {
            await cache.put(request, response.clone());
          }

          return response;
        } catch (error) {
          if (request.mode === 'navigate') {
            return (
              await cache.match(INDEX_URL) ||
              Response.error()
            );
          }

          return Response.error();
        }
      })()
    );
  }
});
