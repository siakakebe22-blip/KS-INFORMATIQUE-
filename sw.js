
const CACHE_NAME = 'ks-informatique-v5';

const APP_ROOT = self.registration.scope;
const HOME_URL = APP_ROOT;
const INDEX_URL = new URL('index.html', APP_ROOT).href;

const SUPABASE_CDN =
  'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';

self.addEventListener('install', event => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);

      await cache.add(HOME_URL);
      
      try {
        await cache.add(SUPABASE_CDN);
      } catch (error) {
        console.log('Supabase sera chargé en ligne.');
      }

      await self.skipWaiting();
    })()
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();

      await Promise.all(
        keys
          .filter(key =>
            key.startsWith('ks-informatique-') &&
            key !== CACHE_NAME
          )
          .map(key => caches.delete(key))
      );

      await self.clients.claim();
    })()
  );
});

self.addEventListener('fetch', event => {
  const request = event.request;

  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  if (
    url.origin === self.location.origin ||
    url.href === SUPABASE_CDN
  ) {
    event.respondWith(
      (async () => {
        const cache = await caches.open(CACHE_NAME);

        try {
          const response = await fetch(request);

          if (response.ok) {
            await cache.put(request, response.clone());
          }

          return response;
        } catch (error) {
          const saved = await cache.match(request);

          if (saved) return saved;

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
