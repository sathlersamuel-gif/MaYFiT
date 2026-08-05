const VERSION = "mayfit-v6";
const APP_CACHE = `${VERSION}-app`;
const MEDIA_CACHE = `${VERSION}-media`;
const LEGACY_PHOTO_CACHE = "mayfit-exercise-photos-v1";
const CORE = ["/", "/index.html", "/manifest.webmanifest"];
const EXERCISE_HOST = "raw.githubusercontent.com";

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(APP_CACHE)
      .then((cache) => cache.addAll(CORE))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) =>
              key.startsWith("mayfit-") &&
              ![APP_CACHE, MEDIA_CACHE, LEGACY_PHOTO_CACHE].includes(key),
            )
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

function normalizedMediaRequest(request) {
  const url = new URL(request.url);
  url.searchParams.delete("mayfit_retry");
  return url.href === request.url ? request : new Request(url.href, request);
}

async function updateCache(cacheName, request, cacheRequest = request) {
  try {
    const response = await fetch(request);
    if (response.ok || response.type === "opaque") {
      const cache = await caches.open(cacheName);
      await cache.put(cacheRequest, response.clone());
    }
    return response;
  } catch {
    return null;
  }
}

async function staleWhileRevalidate(event, cacheName, fallback, cacheRequest = event.request) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(cacheRequest);
  const update = updateCache(cacheName, event.request, cacheRequest);
  if (cached) {
    event.waitUntil(update);
    return cached;
  }
  const response = await update;
  return response || caches.match(fallback || event.request);
}

async function networkFirst(request, cacheName, fallback) {
  const response = await updateCache(cacheName, request);
  if (response) return response;
  const cache = await caches.open(cacheName);
  return (await cache.match(request)) || cache.match(fallback || request);
}

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  const isExerciseMedia =
    url.hostname === EXERCISE_HOST &&
    url.pathname.includes("/free-exercise-db/");
  if (isExerciseMedia) {
    event.respondWith(
      staleWhileRevalidate(
        event,
        MEDIA_CACHE,
        undefined,
        normalizedMediaRequest(request),
      ),
    );
    return;
  }
  if (url.origin !== self.location.origin) return;
  if (request.mode === "navigate") {
    event.respondWith(networkFirst(request, APP_CACHE, "/index.html"));
    return;
  }
  event.respondWith(staleWhileRevalidate(event, APP_CACHE));
});
