import { supabase } from './lib/supabase.js';

const USER_KEY='mayfit_user';
const SELECTED_KEY='mayfit_selected_student_id';

function currentSessionUser(){
  try{return JSON.parse(sessionStorage.getItem(USER_KEY)||'null')}catch{return null}
}

async function realProfileId(){
  const selected=sessionStorage.getItem(SELECTED_KEY);
  if(selected)return selected;
  const {data}=await supabase.auth.getUser();
  return data?.user?.id||null;
}

async function repairLegacyDemoSession(){
  const current=currentSessionUser();
  if(!current||String(current.name||current.full_name||'').trim()!=='Aluno Teste')return;

  const id=await realProfileId();
  if(!id){
    sessionStorage.removeItem(USER_KEY);
    return;
  }

  const {data,error}=await supabase
    .from('profiles')
    .select('id,full_name,role,status')
    .eq('id',id)
    .maybeSingle();

  if(error||!data)return;

  const repaired={
    ...current,
    id:data.id,
    name:data.full_name||'Usuário',
    full_name:data.full_name||'Usuário',
    role:data.role||current.role,
  };
  sessionStorage.setItem(USER_KEY,JSON.stringify(repaired));
}

await repairLegacyDemoSession();
window.addEventListener('pageshow',repairLegacyDemoSession);
window.addEventListener('focus',repairLegacyDemoSession);
