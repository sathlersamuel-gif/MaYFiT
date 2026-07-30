const VERSION='mayfit-sw-v19';

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

  if(url.origin===self.location.origin&&url.pathname==='/src/supabase-auth-bridge.js'){
    event.respondWith((async()=>{
      const response=await fetch(event.request,{cache:'no-store'});
      let source=await response.text();

      source=source.replace(
        "    const { error } = await supabase.auth.updateUser({ password });\n    if (error) throw error;\n    await supabase.auth.signOut();\n    sessionStorage.removeItem(USER_KEY);\n    history.replaceState({}, document.title, location.pathname);\n    alert('Senha alterada com sucesso. Agora entre usando sua nova senha.');\n    location.reload();",
        "    const { error } = await supabase.auth.updateUser({ password });\n    if (error) throw error;\n    sessionStorage.removeItem(USER_KEY);\n    history.replaceState({}, document.title, location.pathname);\n    alert('Senha alterada com sucesso. Agora entre usando sua nova senha.');\n    try { await supabase.auth.signOut(); } catch {}\n    location.reload();"
      );

      return new Response(source,{
        status:response.status,
        statusText:response.statusText,
        headers:{'Content-Type':'text/javascript; charset=utf-8','Cache-Control':'no-store'}
      });
    })());
    return;
  }

  if(url.origin===self.location.origin&&url.pathname==='/src/main.jsx'){
    event.respondWith((async()=>{
      const response=await fetch(event.request,{cache:'no-store'});
      let source=await response.text();

      source=source.replace(
        "function Workout({data,setData,onBack}){const[entries,setEntries]=useState(()=>Object.fromEntries(data.exercises.map(e=>[e.id,{...e}])));",
        "function Workout({data,setData,onBack,user}){const progressKey=`mayfit_student_progress_${user?.id||'guest'}`;const[entries,setEntries]=useState(()=>{let saved={};try{saved=JSON.parse(localStorage.getItem(progressKey)||'{}')}catch{}return Object.fromEntries(data.exercises.map(e=>[e.id,{...e,...(saved[e.id]||{})}]))});"
      );

      source=source.replace(
        "const[timeText,setTimeText]=useState(format(data.exercises[0]?.rest||60));const zeroHandled=useRef(false);",
        "const[timeText,setTimeText]=useState(format(data.exercises[0]?.rest||60));const zeroHandled=useRef(false);useEffect(()=>{if(!user||user.role==='admin')return;localStorage.setItem(progressKey,JSON.stringify(entries));setData(current=>({...current,exercises:current.exercises.map(e=>entries[e.id]?{...e,...entries[e.id]}:e)}))},[entries,progressKey,user?.id]);"
      );

      source=source.replace(
        "if(workout)return <div className=\"app\"><Workout data={data} setData={setData} onBack={()=>setWorkout(false)}/></div>;",
        "if(workout)return <div className=\"app\"><Workout data={data} setData={setData} user={user} onBack={()=>setWorkout(false)}/></div>;"
      );

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

      source=source.replace(
        "const conclude=e=>{if(done[e.id])",
        "const conclude=e=>{setDone(old=>({...old,[e.id]:!old[e.id]}));return;if(done[e.id])"
      );

      source=source.replace(
        "const logout=()=>{setUser(null);sessionStorage.removeItem('mayfit_user')};",
        "const logout=()=>{setUser(null);sessionStorage.removeItem('mayfit_user');sessionStorage.removeItem('mayfit_admin_return')};"
      );

      source=source.replace(
        "<button onClick={()=>{const aluno=data.users.find(u=>u.id==='aluno');setUser(aluno);sessionStorage.setItem('mayfit_user',JSON.stringify(aluno))}}><User/><span>Ver aluno</span></button>",
        "<button onClick={()=>{const aluno=data.users.find(u=>u.id==='aluno');sessionStorage.setItem('mayfit_admin_return',JSON.stringify(user));setUser(aluno);sessionStorage.setItem('mayfit_user',JSON.stringify(aluno))}}><User/><span>Ver aluno</span></button>"
      );

      source=source.replace(
        "</>:<><button className={tab==='inicio'?'active':''} onClick={()=>setTab('inicio')}><Home/><span>Início</span></button>",
        "</>:<>{sessionStorage.getItem('mayfit_admin_return')&&<button onClick={()=>{try{const adminUser=JSON.parse(sessionStorage.getItem('mayfit_admin_return'));setUser(adminUser);sessionStorage.setItem('mayfit_user',JSON.stringify(adminUser));sessionStorage.removeItem('mayfit_admin_return');setTab('inicio')}catch{}}}><Users/><span>Gerenciador</span></button>}<button className={tab==='inicio'?'active':''} onClick={()=>setTab('inicio')}><Home/><span>Início</span></button>"
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