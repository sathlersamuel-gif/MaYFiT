const translations={
  'Workout A':'Treino A','Workout B':'Treino B','Workout C':'Treino C','Workout D':'Treino D',
  'Push':'Empurrar','Pull':'Puxar','Legs':'Pernas','Upper Body':'Parte superior',
  'Lower Body':'Parte inferior','Full Body':'Corpo inteiro'
};

function clean(value){return String(value||'').replace(/\s+/g,' ').trim()}

function removeExtraControls(){
  document.querySelectorAll('.mayfit-rename-workout').forEach(element=>element.remove());
  document.querySelectorAll('.mayfit-workout-card').forEach(element=>element.classList.remove('mayfit-workout-card'));
  document.querySelectorAll('.mayfit-editable-workout-title').forEach(element=>{
    element.classList.remove('mayfit-editable-workout-title');
    element.removeAttribute('title');
  });
  document.getElementById('mayfit-workout-name-style')?.remove();
}

function translateDefaults(){
  document.querySelectorAll('h1,h2,h3,strong,span').forEach(element=>{
    const text=clean(element.textContent);
    if(translations[text])element.textContent=translations[text];
  });
}

function apply(){removeExtraControls();translateDefaults()}

let queued=false;
const observer=new MutationObserver(()=>{
  if(queued)return;
  queued=true;
  requestAnimationFrame(()=>{queued=false;apply()});
});
observer.observe(document.documentElement,{childList:true,subtree:true});
window.addEventListener('pageshow',apply);
apply();
