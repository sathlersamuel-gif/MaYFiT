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
function saveName(value){const name=translate(value);if(!name)return false;writeStore({...readStore(),workoutName:name});return true}
function askRename(){const answer=prompt('Digite o nome que deve aparecer no treino:',currentName());if(answer===null)return;if(!saveName(answer)){alert('Digite um nome para o treino.');return}apply()}

function ensureStyle(){
  if(document.getElementById('mayfit-workout-name-style'))return;
  const style=document.createElement('style');
  style.id='mayfit-workout-name-style';
  style.textContent=`
    .mayfit-rename-workout{display:inline-flex!important;align-items:center!important;justify-content:center!important;min-height:36px!important;padding:8px 12px!important;border:1px solid #8df20b!important;border-radius:12px!important;background:rgba(7,17,8,.92)!important;color:#8df20b!important;font:900 12px system-ui,-apple-system,sans-serif!important;cursor:pointer!important;z-index:20!important}
    .mayfit-workout-card{position:relative!important}
    .mayfit-workout-card>.mayfit-rename-workout{position:absolute!important;right:16px!important;top:16px!important}
    .mayfit-editable-workout-title{cursor:pointer!important}
    .mayfit-editable-workout-title::after{content:' ✎';font-size:.42em;color:#8df20b;vertical-align:middle}
    @media(max-width:620px){.mayfit-workout-card>.mayfit-rename-workout{right:12px!important;top:12px!important;min-height:32px!important;padding:6px 9px!important;font-size:10px!important}}
  `;
  document.head.appendChild(style);
}

function exactText(element,value){return clean(element?.textContent).toLowerCase()===value.toLowerCase()}
function findWorkoutCard(){
  const labels=[...document.querySelectorAll('body *')].filter(el=>exactText(el,'TREINO DO DIA'));
  for(const label of labels){
    let node=label.parentElement;
    for(let depth=0;node&&depth<7;depth++,node=node.parentElement){
      const title=node.querySelector('h1,h2');
      const start=[...node.querySelectorAll('button,a,[role="button"]')].find(el=>/iniciar\s+treino/i.test(clean(el.textContent)));
      if(title&&start)return node;
    }
  }
  return null;
}

function bindTitle(title){
  if(!title)return;
  title.textContent=currentName();
  title.classList.add('mayfit-editable-workout-title');
  title.setAttribute('title','Toque para renomear o treino');
  if(title.dataset.renameBound==='1')return;
  title.dataset.renameBound='1';
  title.addEventListener('click',event=>{event.preventDefault();event.stopPropagation();askRename()});
}

function installCardButton(card){
  if(!card)return;
  card.classList.add('mayfit-workout-card');
  if(card.querySelector(':scope > .mayfit-rename-workout'))return;
  const button=document.createElement('button');
  button.type='button';
  button.className='mayfit-rename-workout';
  button.textContent='Renomear treino';
  button.addEventListener('click',event=>{event.preventDefault();event.stopPropagation();askRename()});
  card.appendChild(button);
}

function installManagementButtons(){
  document.querySelectorAll('section,article,div').forEach(container=>{
    const text=clean(container.textContent);
    if(!/gerenciar treino|novo treino|criar treino/i.test(text))return;
    const heading=container.querySelector('h1,h2,h3,strong');
    if(!heading)return;
    if(container.querySelector('.mayfit-rename-workout'))return;
    const button=document.createElement('button');
    button.type='button';
    button.className='mayfit-rename-workout';
    button.textContent='Renomear treino';
    button.style.marginLeft='10px';
    button.addEventListener('click',event=>{event.preventDefault();event.stopPropagation();askRename()});
    heading.insertAdjacentElement('afterend',button);
  });
}

function translateVisibleDefaults(){
  document.querySelectorAll('h1,h2,h3,strong,span').forEach(el=>{
    const text=clean(el.textContent);
    if(/^(Workout|Treino) [A-D]$/i.test(text))el.textContent=translations[text]||currentName();
  });
}

function apply(){
  ensureStyle();
  const card=findWorkoutCard();
  if(card){bindTitle(card.querySelector('h1,h2'));installCardButton(card)}
  installManagementButtons();
  translateVisibleDefaults();
}

let queued=false;
const observer=new MutationObserver(()=>{if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;apply()})});
observer.observe(document.documentElement,{childList:true,subtree:true});
window.addEventListener('mayfit-store-updated',apply);
window.addEventListener('storage',event=>{if(event.key===STORE)apply()});
window.addEventListener('pageshow',apply);
document.addEventListener('click',()=>requestAnimationFrame(apply),true);
apply();
