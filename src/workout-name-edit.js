const USER_KEY='mayfit_user';
const NAME_PREFIX='mayfit_workout_name_';

function currentUser(){
  try{return JSON.parse(sessionStorage.getItem(USER_KEY)||'null')}catch{return null}
}

function storageKey(){
  const user=currentUser();
  return NAME_PREFIX+(user?.id||'student');
}

function findWorkoutTitle(){
  const user=currentUser();
  if(user?.role!=='student')return null;
  const candidates=[...document.querySelectorAll('.app main h1,.app main h2,.app main h3,.app main strong')];
  return candidates.find(element=>/^treino\s+a$/i.test((element.textContent||'').trim())||element.dataset.workoutNameHost==='true')||null;
}

function installEditableName(){
  const title=findWorkoutTitle();
  if(!title||title.dataset.workoutNameReady==='true')return;

  title.dataset.workoutNameReady='true';
  title.dataset.workoutNameHost='true';
  const saved=(localStorage.getItem(storageKey())||'').trim();
  const defaultName=saved||currentUser()?.name||currentUser()?.full_name||'';

  title.innerHTML='';
  title.style.display='flex';
  title.style.alignItems='baseline';
  title.style.flexWrap='wrap';
  title.style.gap='6px';

  const prefix=document.createElement('span');
  prefix.textContent='Treino de';

  const input=document.createElement('input');
  input.type='text';
  input.value=defaultName;
  input.placeholder='seu nome';
  input.setAttribute('aria-label','Nome do treino');
  input.autocomplete='name';
  input.style.cssText='min-width:130px;max-width:100%;flex:1;border:0;border-bottom:2px solid #78d532;border-radius:0;background:transparent;color:inherit;font:inherit;font-weight:inherit;line-height:1.15;padding:0 2px 2px;outline:none';

  const stopCardAction=event=>event.stopPropagation();
  input.addEventListener('click',stopCardAction);
  input.addEventListener('pointerdown',stopCardAction);
  input.addEventListener('touchstart',stopCardAction,{passive:true});

  const saveName=()=>{
    const value=input.value.trim();
    if(value)localStorage.setItem(storageKey(),value);
    else localStorage.removeItem(storageKey());
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
