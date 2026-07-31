import './student-workout-manager.js';

const USER_KEY='mayfit_user';
const ADMIN_RETURN_KEY='mayfit_admin_return';

function readSession(key){
  try{return JSON.parse(sessionStorage.getItem(key)||'null')}catch{return null}
}

function restoreAdmin(){
  const admin=readSession(ADMIN_RETURN_KEY);
  if(!admin?.id||admin.role!=='admin')return false;
  sessionStorage.setItem(USER_KEY,JSON.stringify(admin));
  sessionStorage.removeItem(ADMIN_RETURN_KEY);
  location.reload();
  return true;
}

function isAdminPreview(){
  const admin=readSession(ADMIN_RETURN_KEY);
  const current=readSession(USER_KEY);
  return admin?.role==='admin'&&current?.role!=='admin';
}

document.addEventListener('click',event=>{
  if(!isAdminPreview())return;
  const button=event.target.closest('button');
  if(!button)return;
  const text=button.textContent.trim();
  if(text==='Sair'||text==='Perfil'){
    event.preventDefault();
    event.stopImmediatePropagation();
    restoreAdmin();
  }
},true);

function removeDemoIdentity(){
  if(!isAdminPreview())return;
  const profile=document.querySelector('.profile');
  if(!profile)return;
  const name=profile.querySelector('h1');
  const email=profile.querySelector('p');
  if(name?.textContent.trim()==='Aluno Teste')name.textContent='Visualização do aluno';
  if(email?.textContent.trim()==='aluno@mayfit.com')email.textContent='Retorne ao painel administrativo para escolher um aluno cadastrado.';
}

const observer=new MutationObserver(removeDemoIdentity);
observer.observe(document.documentElement,{childList:true,subtree:true});
removeDemoIdentity();