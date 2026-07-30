import { supabase } from './lib/supabase.js';

const USER_KEY='mayfit_user';
const VIEW_STUDENT_KEY='mayfit_view_student';
const STORE_KEY='mayfit_v8';

function readJson(storage,key){try{return JSON.parse(storage.getItem(key)||'null')}catch{return null}}

function writeRealUser(profile,authUser){
  const user={
    id:profile.id,
    name:profile.full_name||authUser?.user_metadata?.full_name||authUser?.email?.split('@')[0]||'Usuário',
    email:authUser?.email||'',
    role:profile.role||'student',
    status:profile.status||'pending'
  };
  sessionStorage.setItem(USER_KEY,JSON.stringify(user));
  if(user.role!=='admin')sessionStorage.removeItem(VIEW_STUDENT_KEY);
  return user;
}

function removeLegacySession(){
  const current=readJson(sessionStorage,USER_KEY);
  const legacy=current?.id==='admin'||current?.id==='aluno'||current?.email==='admin@mayfit.com'||current?.email==='aluno@mayfit.com';
  if(legacy)sessionStorage.removeItem(USER_KEY);

  const local=readJson(localStorage,STORE_KEY);
  if(local&&typeof local==='object'&&Array.isArray(local.users)){
    const cleaned={...local};
    delete cleaned.users;
    localStorage.setItem(STORE_KEY,JSON.stringify(cleaned));
  }
}

export async function synchronizeAuthSession(){
  removeLegacySession();
  if(!supabase)return null;

  const {data:{session},error:sessionError}=await supabase.auth.getSession();
  if(sessionError){console.error('MaYFiT: falha ao restaurar sessão:',sessionError.message);return null}
  if(!session?.user)return null;

  const {data:profile,error}=await supabase
    .from('profiles')
    .select('id,full_name,role,status')
    .eq('id',session.user.id)
    .maybeSingle();

  if(error){console.error('MaYFiT: falha ao carregar perfil real:',error.message);return null}
  if(!profile){
    await supabase.auth.signOut();
    sessionStorage.removeItem(USER_KEY);
    return null;
  }

  return writeRealUser(profile,session.user);
}

export function installRealLogout(){
  document.addEventListener('click',async event=>{
    const button=event.target.closest('button');
    if(!button)return;
    const text=(button.textContent||'').trim().toLowerCase();
    if(text!=='sair')return;
    event.preventDefault();
    event.stopImmediatePropagation();
    try{await supabase?.auth.signOut()}catch{}
    sessionStorage.removeItem(USER_KEY);
    sessionStorage.removeItem(VIEW_STUDENT_KEY);
    location.reload();
  },true);
}
