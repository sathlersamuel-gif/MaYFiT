const USER_KEY='mayfit_user';
const NAME_PREFIX='mayfit_workout_name_';

function currentUser(){
  try{return JSON.parse(sessionStorage.getItem(USER_KEY)||'null')}catch{return null}
}

function storageKey(){
  const user=currentUser();
  return NAME_PREFIX+(user?.id||'student');
}

function cleanText(value){
  return String(value||'').replace(/[\u200B-\u200D\u2060\uFEFF]/g,'').replace(/\s+/g,' ').trim();
}

function findWorkoutTitle(){
  const user=currentUser();
  if(user?.role!=='student')return null;
  const preferred=document.querySelector('.app main .hero h1');
  if(preferred)return preferred;
  const candidates=[...document.querySelectorAll('.app main h1,.app main h2,.app main h3,.app main strong')];
  return candidates.find(element=>{
    const text=cleanText(element.textContent).toLowerCase();
    return element.dataset.workoutNameHost==='true'||text==='treino a'||text.startsWith('treino de')||text==='meu treino';
  })||null;
}

function installEditableName(){
  const title=findWorkoutTitle();
  if(!title)return;
  const existing=title.querySelector('input[data-workout-name-input]');
  if(existing)return;

  title.dataset.workoutNameReady='true';
  title.dataset.workoutNameHost='true';
  const saved=(localStorage.getItem(storageKey())||'').trim();
  const defaultName=saved||currentUser()?.name||currentUser()?.full_name||'Meu treino';

  title.innerHTML='';
  title.style.display='flex';
  title.style.alignItems='baseline';
  title.style.flexWrap='wrap';
  title.style.gap='6px';

  const prefix=document.createElement('span');
  prefix.textContent='Treino:';

  const input=document.createElement('input');
  input.dataset.workoutNameInput='true';
  input.type='text';
  input.value=defaultName;
  input.placeholder='Digite o nome do treino';
  input.setAttribute('aria-label','Nome do treino');
  input.autocomplete='off';
  input.style.cssText='min-width:150px;max-width:100%;flex:1;border:0;border-bottom:2px solid #78d532;border-radius:0;background:transparent;color:inherit;font:inherit;font-weight:inherit;line-height:1.15;padding:0 2px 2px;outline:none';

  const stop=event=>event.stopPropagation();
  ['click','pointerdown','touchstart'].forEach(type=>input.addEventListener(type,stop,{passive:type==='touchstart'}));

  const saveName=()=>{
    const value=input.value.trim();
    if(value)localStorage.setItem(storageKey(),value);
    else localStorage.removeItem(storageKey());
    window.dispatchEvent(new CustomEvent('mayfit-workout-name-updated',{detail:{name:value}}));
  };

  input.addEventListener('input',saveName);
  input.addEventListener('blur',saveName);
  input.addEventListener('keydown',event=>{
    event.stopPropagation();
    if(event.key==='Enter'){
      event.preventDefault();
      input.blur();
    }
  });

  title.append(prefix,input);
}

const observer=new MutationObserver(()=>requestAnimationFrame(installEditableName));
observer.observe(document.documentElement,{childList:true,subtree:true});
window.addEventListener('pageshow',installEditableName);
window.addEventListener('focus',installEditableName);
document.addEventListener('visibilitychange',()=>{if(!document.hidden)installEditableName()});
installEditableName();
