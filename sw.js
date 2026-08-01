const VERSION='mayfit-sw-v22-ui-aluno';

self.addEventListener('install',event=>{
  self.skipWaiting();
  event.waitUntil(
    caches.keys().then(keys=>Promise.all(keys.map(key=>caches.delete(key))))
  );
});

self.addEventListener('activate',event=>{
  event.waitUntil((async()=>{
    const keys=await caches.keys();
    await Promise.all(keys.map(key=>caches.delete(key)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET')return;

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
