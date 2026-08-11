import { supabase } from './lib/supabase.js';

const USER_KEY='mayfit_user';
let scheduled=false;

function currentUser(){
  try{return JSON.parse(sessionStorage.getItem(USER_KEY)||'null')}catch{return null}
}

function isStudent(){return currentUser()?.role==='student'}

async function logoutStudent(button){
  if(button)button.disabled=true;
  try{await supabase?.auth?.signOut?.()}catch{}
  sessionStorage.removeItem(USER_KEY);
  sessionStorage.removeItem('mayfit_admin_return');
  sessionStorage.removeItem('mayfit_selected_student_id');
  location.reload();
}

function openStudentSettings(){
  if(!isStudent())return;
  document.getElementById('mayfit-settings-modal')?.remove();
  const modal=document.createElement('div');
  modal.id='mayfit-settings-modal';
  modal.innerHTML=`
    <div class="mayfit-settings-card">
      <div>
        <h2>Configurações</h2>
        <button type="button" data-close aria-label="Fechar">×</button>
      </div>
      <button type="button" class="mayfit-settings-logout" data-logout>Sair</button>
      <button type="button" data-close>Voltar</button>
    </div>`;
  modal.querySelectorAll('[data-close]').forEach(button=>button.onclick=()=>modal.remove());
  modal.querySelector('[data-logout]')?.addEventListener('click',event=>logoutStudent(event.currentTarget));
  modal.onclick=event=>{if(event.target===modal)modal.remove()};
  document.body.appendChild(modal);
}

function cleanLegacySettings(){
  if(!isStudent())return;

  document.querySelectorAll('.mayfit-sound-dialog .mayfit-settings-logout').forEach(button=>button.remove());
  document.querySelectorAll('#mayfit-settings-modal [data-theme]').forEach(button=>button.remove());

  const settingsModal=document.getElementById('mayfit-settings-modal');
  if(settingsModal){
    [...settingsModal.querySelectorAll('button,label,span,div')].forEach(element=>{
      const text=String(element.textContent||'').trim().toLowerCase();
      if(text.includes('tema claro')||text.includes('tema escuro')||text.includes('claro/escuro'))element.remove();
    });
  }

  const gear=document.querySelector('[data-mayfit-settings]');
  if(gear&&gear.dataset.mayfitSettingsFixed!=='1'){
    gear.dataset.mayfitSettingsFixed='1';
    gear.onclick=event=>{
      event.preventDefault();
      event.stopPropagation();
      openStudentSettings();
    };
  }
}

function scheduleCleanup(){
  if(scheduled)return;
  scheduled=true;
  requestAnimationFrame(()=>{
    scheduled=false;
    cleanLegacySettings();
  });
}

const style=document.createElement('style');
style.id='mayfit-student-settings-fix-style';
style.textContent=`
.mayfit-sound-dialog .mayfit-settings-logout{display:none!important}
#mayfit-settings-modal [data-theme]{display:none!important}
#mayfit-settings-modal .mayfit-settings-logout{display:block!important;width:100%!important}
`;
document.head.appendChild(style);

const observer=new MutationObserver(scheduleCleanup);
observer.observe(document.documentElement,{childList:true,subtree:true});
window.addEventListener('pageshow',scheduleCleanup);
window.addEventListener('focus',scheduleCleanup);
document.addEventListener('click',event=>{
  if(event.target.closest('[data-mayfit-settings],.mayfit-sound-settings-trigger'))setTimeout(scheduleCleanup,0);
},true);
scheduleCleanup();
