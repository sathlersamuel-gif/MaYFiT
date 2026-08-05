const VERSION = "mayfit-v5";
const APP_CACHE = `${VERSION}-app`;
const MEDIA_CACHE = `${VERSION}-media`;
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
            .filter(
              (key) => key.startsWith("mayfit-") && !key.startsWith(VERSION),
            )
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

async function updateCache(cacheName, request) {
  try {
    const response = await fetch(request);
    if (response.ok || response.type === "opaque") {
      const cache = await caches.open(cacheName);
      await cache.put(request, response.clone());
    }
    return response;
  } catch {
    return null;
  }
}

async function staleWhileRevalidate(event, cacheName, fallback) {
  const cached = await caches.match(event.request);
  const update = updateCache(cacheName, event.request);
  if (cached) {
    event.waitUntil(update);
    return cached;
  }
  const response = await update;
  return response || caches.match(fallback || event.request);
}

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  const isExerciseMedia =
    url.hostname === EXERCISE_HOST &&
    url.pathname.includes("/free-exercise-db/");
  if (isExerciseMedia) {
    event.respondWith(staleWhileRevalidate(event, MEDIA_CACHE));
    return;
  }
  if (url.origin !== self.location.origin) return;
  if (request.mode === "navigate") {
    event.respondWith(staleWhileRevalidate(event, APP_CACHE, "/index.html"));
    return;
  }
  event.respondWith(staleWhileRevalidate(event, APP_CACHE));
});
