const VERSION='mayfit-sw-v6';

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

      source=source.replace(
        "if(phase==='pause'){setPhase('exercise');setTimeout(()=>{setSeconds(Number(exercise?.rest)||0);setStarted(true);setRunning(true)},900);return}",
        "if(phase==='pause'){const exerciseSeconds=Math.max(1,Number(exercise?.rest)||1);setPhase('exercise');setSeconds(exerciseSeconds);setTimeText(format(exerciseSeconds));setStarted(true);setRunning(true);return}"
      );

      source=source.replace(
        "if(left>0){setRemainingSets(old=>({...old,[activeId]:left}));setPhase('pause');setTimeout(()=>{setSeconds(pauseValue());setStarted(true);setRunning(true)},900)}",
        "if(left>0){const pauseSeconds=Math.max(1,pauseValue());setRemainingSets(old=>({...old,[activeId]:left}));setPhase('pause');setSeconds(pauseSeconds);setTimeText(format(pauseSeconds));setStarted(true);setRunning(true)}"
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