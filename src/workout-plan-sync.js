const supabase=window.mayfitSupabase;
const STORE='mayfit_v8';
const USER_KEY='mayfit_user';
const APPLIED_PREFIX='mayfit_plan_applied_';
let ready=false;
let lastExercises='';
let saving=false;
let saveTimer=null;

function current(){try{return JSON.parse(sessionStorage.getItem(USER_KEY)||'{}')}catch{return{}}}
function readStore(){try{return JSON.parse(localStorage.getItem(STORE)||'null')}catch{return null}}
function stableExercises(data){return JSON.stringify(Array.isArray(data?.exercises)?data.exercises:[])}
function appliedKey(userId){return APPLIED_PREFIX+userId}

async function loadPlan(){
  const user=current();
  if(!supabase||!user?.id||user.id==='admin')return;
  const {data,error}=await supabase.from('workout_plans').select('user_id,plan_data,updated_at').eq('user_id',user.id).maybeSingle();
  if(error){console.error('Falha ao carregar ficha do aluno:',error);return}
  const local=readStore();
  if(!local)return;
  if(data?.plan_data?.exercises){
    const cloudExercises=data.plan_data.exercises;
    const cloudSignature=JSON.stringify(cloudExercises);
    const applied=localStorage.getItem(appliedKey(user.id));
    if(stableExercises(local)!==cloudSignature){
      local.exercises=cloudExercises;
      localStorage.setItem(STORE,JSON.stringify(local));
      localStorage.setItem(appliedKey(user.id),data.updated_at||cloudSignature);
      if(applied!==(data.updated_at||cloudSignature))location.reload();
    }
    lastExercises=cloudSignature;
  }else{
    lastExercises=stableExercises(local);
    await savePlan(local,true);
  }
}

async function savePlan(data,initial=false){
  const user=current();
  if(!supabase||!user?.id||user.id==='admin'||saving)return;
  const exercises=Array.isArray(data?.exercises)?data.exercises:[];
  if(!exercises.length)return;
  const signature=JSON.stringify(exercises);
  if(!initial&&signature===lastExercises)return;
  saving=true;
  const payload={user_id:user.id,plan_data:{exercises},updated_at:new Date().toISOString()};
  const {data:row,error}=await supabase.from('workout_plans').upsert(payload,{onConflict:'user_id'}).select('updated_at').single();
  saving=false;
  if(error){console.error('Falha ao sincronizar ficha do aluno:',error);return}
  lastExercises=signature;
  localStorage.setItem(appliedKey(user.id),row?.updated_at||payload.updated_at);
}

function scheduleSave(){
  if(!ready)return;
  clearTimeout(saveTimer);
  saveTimer=setTimeout(()=>{const data=readStore();if(data)savePlan(data)},700);
}

function installLocalWatcher(){
  const original=Storage.prototype.setItem;
  if(original.__mayfitPlanSync)return;
  function wrapped(key,value){
    original.call(this,key,value);
    if(this===localStorage&&key===STORE)scheduleSave();
  }
  wrapped.__mayfitPlanSync=true;
  Storage.prototype.setItem=wrapped;
}

function installRealtime(){
  const user=current();
  if(!supabase||!user?.id||user.id==='admin')return;
  supabase.channel(`workout-plan-${user.id}`).on('postgres_changes',{event:'UPDATE',schema:'public',table:'workout_plans',filter:`user_id=eq.${user.id}`},payload=>{
    const exercises=payload.new?.plan_data?.exercises;
    if(!Array.isArray(exercises))return;
    const local=readStore();
    if(!local||stableExercises(local)===JSON.stringify(exercises))return;
    local.exercises=exercises;
    localStorage.setItem(STORE,JSON.stringify(local));
    localStorage.setItem(appliedKey(user.id),payload.new.updated_at||'');
    if(!document.querySelector('.workout-screen'))location.reload();
  }).subscribe();
}

async function start(){
  if(!supabase)return;
  installLocalWatcher();
  await loadPlan();
  ready=true;
  installRealtime();
  setInterval(()=>{const data=readStore();if(data&&stableExercises(data)!==lastExercises)scheduleSave()},2000);
}

start();
