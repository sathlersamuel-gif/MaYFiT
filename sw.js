const VERSION = 'mayfit-sw-v25-cached-images';
const IMAGE_CACHE_NAME = 'mayfit-exercise-images-v1';
const ASSET_CACHE_NAME = 'mayfit-assets-v1';

const isImageRequest = (url) => {
  return (
    url.includes('raw.githubusercontent.com') ||
    url.includes('exercise-photos') ||
    url.includes('body-progress') ||
    /\.(png|jpg|jpeg|gif|webp|svg)($|\?)/i.test(url)
  );
};

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((key) => key !== IMAGE_CACHE_NAME && key !== ASSET_CACHE_NAME)
          .map((key) => caches.delete(key))
      );
      await self.clients.claim();
    })()
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const url = event.request.url;

  // Cache-First strategy for images (0ms load time on Android after first fetch/pre-cache)
  if (isImageRequest(url)) {
    event.respondWith(
      (async () => {
        const cache = await caches.open(IMAGE_CACHE_NAME);
        const cached = await cache.match(event.request);
        if (cached) return cached;

        try {
          const response = await fetch(event.request);
          if (response && response.ok) {
            cache.put(event.request, response.clone());
          }
          return response;
        } catch (error) {
          if (cached) return cached;
          throw error;
        }
      })()
    );
    return;
  }

  // Network-First with Cache fallback for app scripts and assets
  event.respondWith(
    (async () => {
      try {
        const response = await fetch(event.request);
        if (response && response.ok && !url.includes('/api/')) {
          const cache = await caches.open(ASSET_CACHE_NAME);
          cache.put(event.request, response.clone());
        }
        return response;
      } catch (error) {
        const cached = await caches.match(event.request);
        if (cached) return cached;
        throw error;
      }
    })()
  );
});

