
const CACHE_NAME = 'ks-informatique-v3';

const APP_ROOT = self.registration.scope;
const HOME_URL = APP_ROOT;
const INDEX_URL = new URL('index.html', APP_ROOT).href;

const FILES = [
  HOME_URL,
  INDEX_URL
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(FILES))
      .then(() => self.skipWaiting())
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
  
if (url.hostname === 'cdn.jsdelivr.net') {
  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      const saved = await cache.match(request);

      if (saved) return saved;

      try {
        const response = await fetch(request);
        await cache.put(request, response.clone());
        return response;
      } catch (error) {
        return Response.error();
      }
    })()
  );
  return;
}


  if (url.origin !== self.location.origin) return;

  if (request.mode === 'navigate') {
    event.respondWith(
      (async () => {
        try {
          const response = await fetch(request);

          if (response.ok) {
            const cache = await caches.open(CACHE_NAME);
            await cache.put(INDEX_URL, response.clone());
          }

          return response;
        } catch (error) {
          return (
            await caches.match(INDEX_URL) ||
            await caches.match(HOME_URL) ||
            Response.error()
          );
        }
      })()
    );

    return;
  }

  event.respondWith(
    caches.match(request).then(cached => {
      if (cached) return cached;

      return fetch(request).then(response => {
        if (response.ok) {
          const copy = response.clone();

          caches.open(CACHE_NAME).then(cache => {
            cache.put(request, copy);
          });
        }

        return response;
      });
    })
  );
});

