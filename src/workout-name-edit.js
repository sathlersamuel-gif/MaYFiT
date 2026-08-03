const USER_KEY='mayfit_user';
const PREFIX='mayfit_custom_workout_name_';

function currentUser(){
  try{return JSON.parse(sessionStorage.getItem(USER_KEY)||'null')}catch{return null}
}
function clean(value){return String(value||'').replace(/[\u200B-\u200D\u2060\uFEFF]/g,'').replace(/\s+/g,' ').trim()}
function slug(value){return clean(value).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'_').replace(/^_|_$/g,'')||'treino'}
function storageKey(original){return `${PREFIX}${currentUser()?.id||'student'}_${slug(original)}`}

function installStyle(){
  if(document.getElementById('mayfit-workout-rename-direct-style'))return;
  const style=document.createElement('style');
  style.id='mayfit-workout-rename-direct-style';
  style.textContent=`
  .mayfit-workout-title-wrap{display:flex!important;align-items:center!important;gap:8px!important;min-width:0!important}
  .mayfit-workout-title-wrap>[data-mayfit-workout-title]{min-width:0!important}
  .mayfit-workout-rename-button{flex:0 0 34px!important;width:34px!important;height:34px!important;display:grid!important;place-items:center!important;padding:0!important;border:1px solid #4e714f!important;border-radius:10px!important;background:#15231a!important;color:#82df3c!important;font-size:17px!important;font-weight:900!important;line-height:1!important;cursor:pointer!important;z-index:2!important}
  `;
  document.head.appendChild(style);
}

function isCandidate(element){
  if(!element||element.closest('#mse-modal,.workout-screen,.mayfit-history-overlay,nav'))return false;
  if(element.dataset.mayfitWorkoutTitle==='1')return true;
  const text=clean(element.textContent);
  if(!/^treino(?:\s|$)/i.test(text))return false;
  if(text.length>60)return false;
  const container=element.closest('article,section,.card,.panel,div');
  return Boolean(container&&container.querySelector('button'));
}

function candidates(){
  if(currentUser()?.role!=='student')return [];
  return [...document.querySelectorAll('.app main h1,.app main h2,.app main h3,.app main h4,.app main strong,.app main [class*="title"]')].filter(isCandidate);
}

function installEditor(title,index){
  if(title.dataset.mayfitWorkoutTitle==='1'){
    const original=title.dataset.mayfitOriginalTitle;
    const saved=localStorage.getItem(storageKey(original));
    if(saved&&clean(title.textContent)!==saved)title.textContent=saved;
    return;
  }

  const original=clean(title.textContent)||`Treino ${index+1}`;
  title.dataset.mayfitWorkoutTitle='1';
  title.dataset.mayfitOriginalTitle=original;
  const saved=localStorage.getItem(storageKey(original));
  if(saved)title.textContent=saved;

  const parent=title.parentElement;
  if(!parent)return;
  parent.classList.add('mayfit-workout-title-wrap');
  if(parent.querySelector(':scope > .mayfit-workout-rename-button'))return;

  const button=document.createElement('button');
  button.type='button';
  button.className='mayfit-workout-rename-button';
  button.textContent='✎';
  button.setAttribute('aria-label','Renomear treino');
  button.title='Renomear treino';
  ['pointerdown','touchstart'].forEach(type=>button.addEventListener(type,event=>event.stopPropagation(),{passive:type==='touchstart'}));
  button.addEventListener('click',event=>{
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
    const current=clean(title.textContent)||original;
    const value=prompt('Digite o novo nome do treino:',current);
    if(value===null)return;
    const next=clean(value);
    if(!next)return;
    localStorage.setItem(storageKey(original),next);
    title.textContent=next;
  },true);
  title.insertAdjacentElement('afterend',button);
}

function apply(){
  installStyle();
  candidates().forEach(installEditor);
}

let queued=false;
const observer=new MutationObserver(()=>{
  if(queued)return;
  queued=true;
  requestAnimationFrame(()=>{queued=false;apply()});
});
observer.observe(document.documentElement,{childList:true,subtree:true,characterData:true});
window.addEventListener('pageshow',apply);
window.addEventListener('focus',apply);
document.addEventListener('visibilitychange',()=>{if(!document.hidden)apply()});
setInterval(apply,800);
apply();
