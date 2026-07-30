import { supabase } from './lib/supabase.js';

const USER_KEY='mayfit_user';
const HISTORY_PREFIX='mayfit_workout_history_';
let syncing=false;

function currentUser(){
  try{return JSON.parse(sessionStorage.getItem(USER_KEY)||'null')}catch{return null}
}

function readLocal(userId){
  try{return JSON.parse(localStorage.getItem(HISTORY_PREFIX+userId)||'[]')}catch{return[]}
}

function writeLocal(userId,items){
  localStorage.setItem(HISTORY_PREFIX+userId,JSON.stringify(items));
}

async function syncPendingHistory(){
  if(syncing||!supabase||!navigator.onLine)return;
  const profile=currentUser();
  if(!profile?.id||profile.role==='admin'||sessionStorage.getItem('mayfit_admin_return'))return;
  syncing=true;
  try{
    const {data,error}=await supabase.auth.getUser();
    const authId=data?.user?.id;
    if(error||!authId||authId!==profile.id)return;
    const local=readLocal(profile.id);
    const pending=local.filter(item=>item&&!item.cloud&&item.id);
    if(!pending.length)return;
    const rows=pending.map(item=>({
      id:item.id,
      user_id:authId,
      workout_name:item.name||'Treino',
      workout_data:{exercises:Array.isArray(item.exercises)?item.exercises:[]},
      created_at:item.date||new Date().toISOString(),
      updated_at:item.date||new Date().toISOString()
    }));
    const result=await supabase.from('workout_history').upsert(rows,{onConflict:'id'});
    if(result.error){console.error('Falha ao sincronizar histórico pendente:',result.error);return}
    const syncedIds=new Set(pending.map(item=>item.id));
    writeLocal(profile.id,local.map(item=>syncedIds.has(item.id)?{...item,cloud:true}:item));
  }finally{
    syncing=false;
  }
}

window.addEventListener('online',syncPendingHistory);
document.addEventListener('visibilitychange',()=>{if(!document.hidden)syncPendingHistory()});
document.addEventListener('click',event=>{
  if(event.target.closest('button.finish'))setTimeout(syncPendingHistory,800);
},true);
supabase?.auth.onAuthStateChange(()=>setTimeout(syncPendingHistory,300));
setTimeout(syncPendingHistory,500);
setInterval(syncPendingHistory,5000);
