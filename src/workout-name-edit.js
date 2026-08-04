const STORE='mayfit_v8';
const DEFAULT_NAME='Treino A';
const translations={
  'Workout A':'Treino A','Workout B':'Treino B','Workout C':'Treino C','Workout D':'Treino D',
  'Push':'Empurrar','Pull':'Puxar','Legs':'Pernas','Upper Body':'Parte superior',
  'Lower Body':'Parte inferior','Full Body':'Corpo inteiro'
};

function readStore(){try{return JSON.parse(localStorage.getItem(STORE)||'{}')}catch{return{}}}
function writeStore(data){localStorage.setItem(STORE,JSON.stringify(data));window.dispatchEvent(new Event('mayfit-store-updated'))}
function clean(value){return String(value||'').replace(/\s+/g,' ').trim()}
function translate(value){const text=clean(value);return translations[text]||text}
function currentName(){const data=readStore();return translate(data.workoutName||DEFAULT_NAME)||DEFAULT_NAME}
function saveName(value){
  const name=clean(value);
  if(!name)return false;
  writeStore({...readStore(),workoutName:translate(name)});
  return true;
}
function askRename(){
  const answer=prompt('Digite o novo nome do treino:',currentName());
  if(answer===null)return;
  if(!saveName(answer)){alert('Digite um nome para o treino.');return}
  apply();
}
function ensureStyle(){
  if(document.getElementById('mayfit-workout-name-style'))return;
  const style=document.createElement('style');
  style.id='mayfit-workout-name-style';
  style.textContent=`
    .mayfit-workout-name-wrap{display:flex!important;align-items:center!important;gap:10px!important;flex-wrap:wrap!important}
    .mayfit-editable-workout-title{cursor:pointer!important;text-decoration:underline dotted rgba(141,242,11,.65)!important;text-underline-offset:5px!important}
    .mayfit-rename-workout{display:inline-flex!important;align-items:center!important;justify-content:center!important;min-height:38px!important;padding:8px 13px!important;border:1px solid #8df20b!important;border-radius:12px!important;background:#102016!important;color:#8df20b!important;font:900 13px system-ui,-apple-system,sans-serif!important;cursor:pointer!important;white-space:nowrap!important}
    .hero .mayfit-rename-workout{position:absolute!important;right:22px!important;top:22px!important;z-index:3!important;background:rgba(5,12,8,.92)!important}
    .hero{position:relative!important}
    @media(max-width:620px){.hero .mayfit-rename-workout{right:14px!important;top:14px!important;min-height:34px!important;padding:7px 10px!important;font-size:11px!important}}
  `;
  document.head.appendChild(style);
}
function setTitle(title){
  if(!title)return;
  const name=currentName();
  const text=clean(title.textContent);
  if(/^(Workout|Treino) [A-D]$/i.test(text)||title.classList.contains('mayfit-editable-workout-title'))title.textContent=name;
  title.classList.add('mayfit-editable-workout-title');
  title.title='Toque para renomear o treino';
  if(!title.dataset.mayfitRenameBound){
    title.dataset.mayfitRenameBound='1';
    title.addEventListener('click',event=>{event.preventDefault();event.stopPropagation();askRename()});
  }
}
function installButton(container){
  if(!container||container.querySelector(':scope > .mayfit-rename-workout'))return;
  const button=document.createElement('button');
  button.type='button';
  button.className='mayfit-rename-workout';
  button.textContent='Renomear treino';
  button.setAttribute('aria-label','Renomear treino');
  button.addEventListener('click',event=>{event.preventDefault();event.stopPropagation();askRename()});
  container.appendChild(button);
  if(!container.classList.contains('hero'))container.classList.add('mayfit-workout-name-wrap');
}
function translateDefaults(){
  document.querySelectorAll('h1,h2,h3,strong,span').forEach(element=>{
    const text=clean(element.textContent);
    if(translations[text])element.textContent=translations[text];
  });
}
function apply(){
  ensureStyle();
  translateDefaults();

  const hero=document.querySelector('.hero');
  const heroTitle=hero?.querySelector('h1,h2,strong');
  if(heroTitle&&/treino|workout/i.test(clean(heroTitle.textContent))){setTitle(heroTitle);installButton(hero)}

  document.querySelectorAll('.section-title,.admin-head,.page-head,.panel-head,.card-header,.workout-header').forEach(container=>{
    const title=container.querySelector('h1,h2,h3,strong');
    const text=clean(title?.textContent);
    if(!title||!/treino|workout/i.test(text))return;
    if(/gerenciar|novo|criar|treino [a-d]|workout [a-d]|meu treino/i.test(text)){
      if(/treino [a-d]|workout [a-d]|meu treino/i.test(text))setTitle(title);
      installButton(container);
    }
  });

  document.querySelectorAll('h1,h2,h3,strong').forEach(title=>{
    const text=clean(title.textContent);
    if(/^(Workout|Treino) [A-D]$/i.test(text)){setTitle(title);installButton(title.parentElement)}
  });
}

let queued=false;
const observer=new MutationObserver(()=>{
  if(queued)return;
  queued=true;
  requestAnimationFrame(()=>{queued=false;apply()});
});
observer.observe(document.documentElement,{childList:true,subtree:true});
window.addEventListener('mayfit-store-updated',apply);
window.addEventListener('storage',event=>{if(event.key===STORE)apply()});
window.addEventListener('pageshow',apply);
document.addEventListener('click',()=>requestAnimationFrame(apply),true);
apply();
