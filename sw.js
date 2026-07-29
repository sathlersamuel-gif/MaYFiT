const VERSION='mayfit-sw-v2';

self.addEventListener('install',()=>self.skipWaiting());
self.addEventListener('activate',event=>event.waitUntil(self.clients.claim()));

self.addEventListener('fetch',event=>{
  const url=new URL(event.request.url);
  if(url.origin!==self.location.origin||url.pathname!=='/src/main.jsx')return;

  event.respondWith((async()=>{
    const response=await fetch(event.request,{cache:'no-store'});
    let source=await response.text();

    const pauseExpression="Math.max(0,Number(localStorage.getItem('mayfit_pause_seconds'))||Number(entries[e.id]?.rest)||60)";
    source=source.replace(
      "const useTime=e=>{setActiveId(e.id);setRemainingSets(old=>({...old,[e.id]:Number(entries[e.id].sets)||1}));setSeconds(Number(entries[e.id].rest)||0);setRunning(false);setStarted(false)}",
      `const useTime=e=>{const pause=${pauseExpression};setEntries(old=>({...old,[e.id]:{...old[e.id],rest:pause}}));setActiveId(e.id);setRemainingSets(old=>({...old,[e.id]:Number(entries[e.id].sets)||1}));setSeconds(pause);setTimeText(format(pause));setRunning(false);setStarted(false)}`
    );

    source=source.replace(
      "setSeconds(Number(entries[e.id].rest)||0);setStarted(true);setRunning(true)",
      "const pause=Math.max(0,Number(localStorage.getItem('mayfit_pause_seconds'))||Number(entries[e.id].rest)||60);setSeconds(pause);setTimeText(format(pause));setStarted(true);setRunning(true)"
    );

    source=source.replace(
      "setSeconds(Number(exercise?.rest)||0);setStarted(true);setRunning(true)",
      "const pause=Math.max(0,Number(localStorage.getItem('mayfit_pause_seconds'))||Number(exercise?.rest)||60);setSeconds(pause);setTimeText(format(pause));setStarted(true);setRunning(true)"
    );

    return new Response(source,{
      status:response.status,
      statusText:response.statusText,
      headers:{'Content-Type':'text/javascript; charset=utf-8','Cache-Control':'no-store'}
    });
  })());
});
