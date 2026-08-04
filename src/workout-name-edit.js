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
    .mayfit-editable-workout-title{cursor:pointer!important;text-decoration:underline dotted rgba(141,242,11,.65)!important;text-underline-offset:5px!important}
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
function translateDefaults(){
  document.querySelectorAll('h1,h2,h3,strong,span').forEach(element=>{
    const text=clean(element.textContent);
    if(translations[text])element.textContent=translations[text];
  });
}
function removeExtraButtons(){
  document.querySelectorAll('.mayfit-rename-workout').forEach(button=>button.remove());
  document.querySelectorAll('.mayfit-workout-name-wrap').forEach(element=>element.classList.remove('mayfit-workout-name-wrap'));
}
function apply(){
  ensureStyle();
  removeExtraButtons();
  translateDefaults();

  const hero=document.querySelector('.hero');
  const heroTitle=hero?.querySelector('h1,h2,strong');
  if(heroTitle&&/treino|workout/i.test(clean(heroTitle.textContent)))setTitle(heroTitle);

  document.querySelectorAll('.section-title,.admin-head,.page-head,.panel-head,.card-header,.workout-header').forEach(container=>{
    const title=container.querySelector('h1,h2,h3,strong');
    const text=clean(title?.textContent);
    if(!title||!/treino|workout/i.test(text))return;
    if(/treino [a-d]|workout [a-d]|meu treino/i.test(text))setTitle(title);
  });

  document.querySelectorAll('h1,h2,h3,strong').forEach(title=>{
    const text=clean(title.textContent);
    if(/^(Workout|Treino) [A-D]$/i.test(text))setTitle(title);
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
