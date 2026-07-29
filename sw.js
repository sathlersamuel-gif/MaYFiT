const VERSION='mayfit-sw-v5';

self.addEventListener('install',event=>{
  self.skipWaiting();
  event.waitUntil(caches.keys().then(keys=>Promise.all(keys.map(key=>caches.delete(key)))));
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
  const url=new URL(event.request.url);

  if(url.origin===self.location.origin&&url.pathname==='/src/main.jsx'){
    event.respondWith((async()=>{
      const response=await fetch(event.request,{cache:'no-store'});
      let source=await response.text();

      source=source.replace(
        "const shownSets=done[e.id]?(Number(v.sets)||1):((remainingSets[e.id]??Number(v.sets))||1);",
        "const shownSets=(activeId===e.id&&started)?((remainingSets[e.id]??Number(v.sets))||1):v.sets;"
      );

      source=source.replace(
        'type="number" min="1" value={shownSets}',
        'type="number" inputMode="numeric" value={shownSets}'
      );

      return new Response(source,{
        status:response.status,
        statusText:response.statusText,
        headers:{'Content-Type':'text/javascript; charset=utf-8','Cache-Control':'no-store'}
      });
    })());
    return;
  }

  event.respondWith(fetch(event.request,{cache:'no-store'}).catch(()=>caches.match(event.request)));
});