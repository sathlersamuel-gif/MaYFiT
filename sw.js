const VERSION='mayfit-sw-v25-transition-images';
const APP_CACHE=`${VERSION}-app`;
const IMAGE_CACHE='mayfit-exercise-photos-v1';
const CATALOG_CACHE='mayfit-exercise-catalog-v1';

self.addEventListener('install',event=>{
  self.skipWaiting();
});

self.addEventListener('activate',event=>{
  event.waitUntil((async()=>{
    const keys=await caches.keys();
    const keep=new Set([APP_CACHE,IMAGE_CACHE,CATALOG_CACHE]);
    await Promise.all(keys.filter(key=>key.startsWith('mayfit-')&&!keep.has(key)).map(key=>caches.delete(key)));
    await self.clients.claim();
  })());
});

async function cachedFirst(request,cacheName){
  const cache=await caches.open(cacheName);
  const cached=await cache.match(request);
  const network=fetch(request).then(async response=>{
    if(response.ok||response.type==='opaque')await cache.put(request,response.clone()).catch(()=>{});
    return response;
  });
  if(cached){network.catch(()=>{});return cached}
  return network;
}

async function networkFirst(request,cacheName){
  const cache=await caches.open(cacheName);
  try{
    const response=await fetch(request);
    if(response.ok||response.type==='opaque')await cache.put(request,response.clone()).catch(()=>{});
    return response;
  }catch(error){
    const cached=await cache.match(request);
    if(cached)return cached;
    throw error;
  }
}

self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET')return;
  const url=new URL(event.request.url);
  const isExerciseImage=url.hostname==='raw.githubusercontent.com'&&url.pathname.includes('/free-exercise-db/')&&/\.(?:jpe?g|png|webp)$/i.test(url.pathname);
  const isCatalog=url.hostname==='raw.githubusercontent.com'&&url.pathname.endsWith('/dist/exercises.json');
  if(isExerciseImage){event.respondWith(cachedFirst(event.request,IMAGE_CACHE));return}
  if(isCatalog){event.respondWith(cachedFirst(event.request,CATALOG_CACHE));return}
  if(url.origin===self.location.origin)event.respondWith(networkFirst(event.request,APP_CACHE));
});
