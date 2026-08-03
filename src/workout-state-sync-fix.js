import './workout-name-edit.js';

const STORE='mayfit_v8';
const DIRTY_KEY='mayfit_workout_data_dirty';
const SYNC_KEY='mayfit_sync_open_workout';

function cleanText(value){
  return String(value||'')
    .replace(/[\u200B-\u200D\u2060\uFEFF]/g,'')
    .replace(/\s+/g,' ')
    .trim()
    .toLowerCase();
}

function isStartWorkout(element){
  const text=cleanText(element?.textContent);
  return text.includes('iniciar meu treino')||text.includes('iniciar treino')||text==='meu treino';
}

function isWorkoutNavigation(element){
  const text=cleanText(element?.textContent);
  return text==='treinos'||text==='treino';
}

function showSilentCover(){
  if(document.getElementById('mayfit-silent-sync-cover'))return;
  const cover=document.createElement('div');
  cover.id='mayfit-silent-sync-cover';
  cover.style.cssText='position:fixed;inset:0;z-index:9999999;background:#050706;pointer-events:auto';
  document.documentElement.appendChild(cover);
}

function findAndOpenWorkout(){
  if(sessionStorage.getItem(SYNC_KEY)!=='1')return;
  let attempts=0;
  let navigationClicked=false;
  const timer=setInterval(()=>{
    attempts++;
    const controls=[...document.querySelectorAll('button,a,[role="button"]')];
    const start=controls.find(isStartWorkout);
    if(start){
      sessionStorage.removeItem(SYNC_KEY);
      clearInterval(timer);
      start.click();
      requestAnimationFrame(()=>document.getElementById('mayfit-silent-sync-cover')?.remove());
      return;
    }
    if(!navigationClicked){
      const nav=controls.find(isWorkoutNavigation);
      if(nav){navigationClicked=true;nav.click()}
    }
    if(attempts>50){
      sessionStorage.removeItem(SYNC_KEY);
      clearInterval(timer);
      document.getElementById('mayfit-silent-sync-cover')?.remove();
    }
  },80);
}

function markChanged(){
  sessionStorage.removeItem(DIRTY_KEY);
  sessionStorage.setItem('mayfit_workout_changed','1');
}

window.addEventListener('mayfit-store-updated',markChanged);
window.addEventListener('storage',event=>{if(event.key===STORE)markChanged()});

document.addEventListener('click',event=>{
  const target=event.target.closest?.('button,a,[role="button"]');
  if(!target||!isStartWorkout(target)||sessionStorage.getItem('mayfit_workout_changed')!=='1')return;
  event.preventDefault();
  event.stopPropagation();
  event.stopImmediatePropagation();
  sessionStorage.removeItem('mayfit_workout_changed');
  sessionStorage.removeItem(DIRTY_KEY);
  sessionStorage.setItem(SYNC_KEY,'1');
  showSilentCover();
  location.reload();
},true);

sessionStorage.removeItem(DIRTY_KEY);
if(sessionStorage.getItem(SYNC_KEY)==='1')showSilentCover();
window.addEventListener('pageshow',findAndOpenWorkout);
findAndOpenWorkout();
