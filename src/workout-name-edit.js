import {readWorkoutData,writeWorkoutData} from './lib/workout-state.js';

const DEFAULT_NAME='Treino A';

const translations={
  'Workout':'Treino',
  'My Workout':'Meu treino',
  'Workout A':'Treino A',
  'Workout B':'Treino B',
  'Workout C':'Treino C',
  'Push':'Empurrar',
  'Pull':'Puxar',
  'Legs':'Pernas',
  'Upper Body':'Parte superior',
  'Lower Body':'Parte inferior',
  'Full Body':'Corpo inteiro',
  'Chest':'Peito',
  'Back':'Costas',
  'Shoulders':'Ombros',
  'Arms':'Braços'
};

function readData(){
  return readWorkoutData()||{}
}

function clean(value){
  return String(value||'').replace(/\s+/g,' ').trim();
}

function translate(value){
  const text=clean(value);
  return translations[text]||text;
}

function readName(){
  const data=readData();
  return translate(data.workoutName||DEFAULT_NAME)||DEFAULT_NAME;
}

function saveName(value){
  const name=translate(value);
  if(!name)return false;
  const data=readData();
  writeWorkoutData({...data,workoutName:name});
  return true;
}

function askName(message='Digite o nome do treino:'){
  const answer=prompt(message,readName());
  if(answer===null)return false;
  if(!saveName(answer)){
    alert('Digite um nome para o treino.');
    return false;
  }
  apply();
  return true;
}

function isWorkoutHeading(element){
  const text=clean(element?.textContent).toLowerCase();
  return /^(meu treino|treino [a-z0-9]+|workout(?: [a-z0-9]+)?|gerenciar treino)$/.test(text);
}

function updateVisibleNames(){
  const name=readName();
  document.querySelectorAll('.hero h1,.section-title h1,.workout-top h1,.workout-top h2,.workout-screen h1,.workout-screen h2').forEach(title=>{
    if(isWorkoutHeading(title)&&!/gerenciar treino/i.test(title.textContent||''))title.textContent=name;
  });

  document.querySelectorAll('button,a,[role="button"],strong,h1,h2,h3').forEach(element=>{
    const current=clean(element.textContent);
    if(translations[current]&&element.children.length===0)element.textContent=translations[current];
  });
}

function installManagementButton(){
  const heading=[...document.querySelectorAll('h1,h2,h3,strong')].find(element=>/gerenciar treino/i.test(clean(element.textContent)));
  if(!heading)return;
  const container=heading.closest('.section-title,.admin-head,header,section,div')||heading.parentElement;
  if(!container||container.querySelector('[data-rename-workout]'))return;

  const button=document.createElement('button');
  button.type='button';
  button.className='small';
  button.dataset.renameWorkout='1';
  button.textContent='Renomear treino';
  button.addEventListener('click',event=>{
    event.preventDefault();
    event.stopPropagation();
    askName('Novo nome do treino:');
  });
  container.appendChild(button);
}

function installNewWorkoutOption(){
  document.querySelectorAll('button,a,[role="button"]').forEach(button=>{
    const text=clean(button.textContent).toLowerCase();
    if(!/^(novo treino|criar treino|adicionar treino|new workout|create workout)$/.test(text))return;
    if(button.dataset.workoutNameReady==='1')return;
    button.dataset.workoutNameReady='1';
    button.addEventListener('click',event=>{
      if(button.dataset.workoutNameConfirmed==='1'){
        delete button.dataset.workoutNameConfirmed;
        return;
      }
      event.preventDefault();
      event.stopImmediatePropagation();
      const answer=prompt('Nome do novo treino:',readName());
      if(answer===null)return;
      if(!saveName(answer)){
        alert('Digite um nome para o treino.');
        return;
      }
      button.dataset.workoutNameConfirmed='1';
      button.click();
      apply();
    },true);
  });
}

function ensureInitialTranslation(){
  const data=readData();
  const current=clean(data.workoutName);
  if(current&&translations[current])saveName(translations[current]);
  else if(!current)saveName(DEFAULT_NAME);
}

function apply(){
  updateVisibleNames();
  installManagementButton();
  installNewWorkoutOption();
}

let queued=false;
const observer=new MutationObserver(()=>{
  if(queued)return;
  queued=true;
  requestAnimationFrame(()=>{queued=false;apply()});
});

ensureInitialTranslation();
observer.observe(document.documentElement,{childList:true,subtree:true});
window.addEventListener('mayfit-store-updated',apply);
window.addEventListener('pageshow',apply);
window.addEventListener('load',apply);
apply();
