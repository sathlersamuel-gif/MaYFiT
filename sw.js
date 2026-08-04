const VERSION='mayfit-sw-v25-instant-workout';
const EXERCISE_IMAGE_CACHE='mayfit-exercise-images-v1';

function isExerciseImage(request){
  if(request.destination!=='image')return false;
  const url=new URL(request.url);
  return url.hostname==='raw.githubusercontent.com'&&url.pathname.includes('/yuhonas/free-exercise-db/');
}

self.addEventListener('install',event=>{
  self.skipWaiting();
  event.waitUntil(
    caches.keys().then(keys=>Promise.all(keys.filter(key=>key!==EXERCISE_IMAGE_CACHE).map(key=>caches.delete(key))))
  );
});

self.addEventListener('activate',event=>{
  event.waitUntil((async()=>{
    const keys=await caches.keys();
    await Promise.all(keys.filter(key=>key!==EXERCISE_IMAGE_CACHE).map(key=>caches.delete(key)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET')return;

  if(isExerciseImage(event.request)){
    event.respondWith((async()=>{
      const cache=await caches.open(EXERCISE_IMAGE_CACHE);
      const cached=await cache.match(event.request);
      if(cached)return cached;
      const response=await fetch(event.request);
      if(response.ok||response.type==='opaque')cache.put(event.request,response.clone());
      return response;
    })());
    return;
  }

  event.respondWith((async()=>{
    try{
      return await fetch(event.request,{cache:'no-store'});
    }catch(error){
      const cached=await caches.match(event.request);
      if(cached)return cached;
      throw error;
    }
  })());
});
