const USER_KEY='mayfit_user';
const NAME_PREFIX='mayfit_workout_title_';

function currentUser(){
  try{return JSON.parse(sessionStorage.getItem(USER_KEY)||'null')}catch{return null}
}

function clean(value){
  return String(value||'').replace(/[\u200B-\u200D\u2060\uFEFF]/g,'').replace(/\s+/g,' ').trim();
}

function keyFor(title){
  const user=currentUser();
  const original=title.dataset.originalWorkoutTitle||clean(title.textContent)||'treino';
  return `${NAME_PREFIX}${user?.id||'student'}_${original.toLowerCase().replace(/[^a-z0-9]+/g,'_')}`;
}

function isWorkoutTitle(element){
  if(!element||element.closest('#mse-modal,.workout-screen'))return false;
  const text=clean(element.textContent).toLowerCase();
  if(!/^treino\b/.test(text))return false;
  const container=element.closest('article,section,div');
  return Boolean(container?.querySelector('button'));
}

function findTitles(){
  if(currentUser()?.role!=='student')return [];
  return [...document.querySelectorAll('.app main h1,.app main h2,.app main h3,.app main strong')].filter(isWorkoutTitle);
}

function installStyle(){
  if(document.getElementById('mayfit-workout-title-edit-style'))return;
  const style=document.createElement('style');
  style.id='mayfit-workout-title-edit-style';
  style.textContent=`
    .mayfit-workout-title-editor{display:flex!important;align-items:center!important;gap:8px!important;min-width:0!important}
    .mayfit-workout-title-input{min-width:0!important;width:100%!important;max-width:260px!important;padding:4px 6px!important;border:0!important;border-bottom:2px solid #78d532!important;border-radius:0!important;background:transparent!important;color:inherit!important;font:inherit!important;font-weight:inherit!important;outline:none!important}
    .mayfit-workout-title-input:focus{border-bottom-color:#a7ef70!important}
    .mayfit-workout-title-edit-icon{flex:0 0 auto!important;color:#78d532!important;font-size:14px!important}
  `;
  document.head.appendChild(style);
}

function makeEditable(title){
  if(title.dataset.mayfitWorkoutEditable==='true')return;
  const original=clean(title.textContent);
  if(!original)return;

  title.dataset.mayfitWorkoutEditable='true';
  title.dataset.originalWorkoutTitle=original;
  title.classList.add('mayfit-workout-title-editor');

  const saved=localStorage.getItem(keyFor(title));
  const input=document.createElement('input');
  input.type='text';
  input.className='mayfit-workout-title-input';
  input.value=saved||original;
  input.placeholder='Nome do treino';
  input.setAttribute('aria-label','Renomear treino');
  input.maxLength=50;

  const icon=document.createElement('span');
  icon.className='mayfit-workout-title-edit-icon';
  icon.textContent='✎';
  icon.setAttribute('aria-hidden','true');

  const save=()=>{
    const value=clean(input.value);
    if(value)localStorage.setItem(keyFor(title),value);
    else{
      localStorage.removeItem(keyFor(title));
      input.value=original;
    }
  };

  ['click','pointerdown','touchstart'].forEach(type=>input.addEventListener(type,event=>event.stopPropagation(),{passive:type==='touchstart'}));
  input.addEventListener('input',save);
  input.addEventListener('blur',save);
  input.addEventListener('keydown',event=>{
    event.stopPropagation();
    if(event.key==='Enter'){
      event.preventDefault();
      input.blur();
    }
  });

  title.replaceChildren(input,icon);
}

function apply(){
  installStyle();
  findTitles().forEach(makeEditable);
}

let queued=false;
const observer=new MutationObserver(()=>{
  if(queued)return;
  queued=true;
  requestAnimationFrame(()=>{queued=false;apply()});
});
observer.observe(document.documentElement,{childList:true,subtree:true});
window.addEventListener('pageshow',apply);
window.addEventListener('focus',apply);
document.addEventListener('visibilitychange',()=>{if(!document.hidden)apply()});
apply();
