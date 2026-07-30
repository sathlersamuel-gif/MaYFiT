import { supabase } from './lib/supabase.js';

const USER_KEY='mayfit_user';
const VIEW_STUDENT_KEY='mayfit_view_student';
let loadingStudent=false;

function readJson(key){
  try{return JSON.parse(sessionStorage.getItem(key)||'null')}catch{return null}
}

function currentUser(){return readJson(USER_KEY)}

async function preloadAdminStudent(){
  const user=currentUser();
  if(loadingStudent||user?.role!=='admin'||!supabase)return;
  loadingStudent=true;
  try{
    const stored=readJson(VIEW_STUDENT_KEY);
    if(stored?.id){
      const {data}=await supabase.from('profiles').select('id,full_name,role,status').eq('id',stored.id).maybeSingle();
      if(data?.role==='student'&&data.status!=='blocked'){
        sessionStorage.setItem(VIEW_STUDENT_KEY,JSON.stringify({id:data.id,name:data.full_name||stored.name||'Aluno'}));
        return;
      }
    }
    const {data,error}=await supabase.from('profiles').select('id,full_name,role,status,created_at').eq('role','student').neq('status','blocked').order('created_at',{ascending:true}).limit(1);
    if(error)throw error;
    const student=data?.[0];
    if(student?.id)sessionStorage.setItem(VIEW_STUDENT_KEY,JSON.stringify({id:student.id,name:student.full_name||'Aluno'}));
  }catch(error){
    console.error('Falha isolada ao preparar aluno para o histórico:',error);
  }finally{
    loadingStudent=false;
  }
}

function alignAdminHeader(){
  if(currentUser()?.role!=='admin')return;
  const gear=document.getElementById('mayfit-settings-button');
  const header=gear?.closest('header');
  if(!header||header.dataset.mayfitAdminAligned==='true')return;
  header.dataset.mayfitAdminAligned='true';
  header.style.display='grid';
  header.style.gridTemplateColumns='minmax(0,1fr) auto auto';
  header.style.alignItems='center';
  header.style.columnGap='6px';
  gear.style.marginLeft='0';
}

function isEmptyHistoryOverlay(){
  const overlay=document.querySelector('.mayfit-history-overlay');
  if(!overlay)return false;
  const empty=overlay.querySelector('.mayfit-history-empty');
  return !!empty&&/nenhum treino salvo|carregando histórico/i.test(empty.textContent||'');
}

function retryAdminHistory(){
  const viewed=readJson(VIEW_STUDENT_KEY);
  if(!viewed?.id||typeof window.mayfitOpenWorkoutHistory!=='function'||!isEmptyHistoryOverlay())return;
  window.mayfitOpenWorkoutHistory(viewed.id,viewed.name||'Aluno');
}

document.addEventListener('click',event=>{
  const card=event.target.closest?.('.summary article');
  if(!card)return;
  const isHistory=[...card.querySelectorAll('span')].some(span=>/treinos salvos/i.test(span.textContent||''));
  if(!isHistory)return;
  setTimeout(retryAdminHistory,500);
  setTimeout(retryAdminHistory,1300);
},true);

const observer=new MutationObserver(()=>alignAdminHeader());
observer.observe(document.documentElement,{childList:true,subtree:true});
preloadAdminStudent();
alignAdminHeader();