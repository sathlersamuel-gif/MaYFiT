const STORE='mayfit_v8';

const translations={
  'Barbell Bench Press - Medium Grip':'Supino reto com barra',
  'Barbell Bench Press':'Supino reto com barra',
  'Dumbbell Bench Press':'Supino reto com halteres',
  'Incline Barbell Bench Press':'Supino inclinado com barra',
  'Incline Dumbbell Press':'Supino inclinado com halteres',
  'Decline Barbell Bench Press':'Supino declinado com barra',
  'Barbell Squat':'Agachamento com barra',
  'Front Barbell Squat':'Agachamento frontal com barra',
  'Leg Press':'Leg press',
  'Leg Extensions':'Cadeira extensora',
  'Lying Leg Curls':'Mesa flexora',
  'Seated Leg Curl':'Cadeira flexora',
  'Standing Calf Raises':'Panturrilha em pé',
  'Seated Calf Raise':'Panturrilha sentado',
  'Barbell Deadlift':'Levantamento terra com barra',
  'Romanian Deadlift':'Levantamento terra romeno',
  'Seated Cable Rows':'Remada baixa na polia',
  'Bent Over Barbell Row':'Remada curvada com barra',
  'Wide-Grip Lat Pulldown':'Puxada frontal aberta',
  'Close-Grip Front Lat Pulldown':'Puxada frontal fechada',
  'Pullups':'Barra fixa',
  'Chin-Up':'Barra fixa supinada',
  'Dumbbell Shoulder Press':'Desenvolvimento com halteres',
  'Military Press':'Desenvolvimento militar',
  'Side Lateral Raise':'Elevação lateral',
  'Front Dumbbell Raise':'Elevação frontal com halteres',
  'Barbell Curl':'Rosca direta com barra',
  'Dumbbell Bicep Curl':'Rosca bíceps com halteres',
  'Hammer Curls':'Rosca martelo',
  'Preacher Curl':'Rosca Scott',
  'Triceps Pushdown':'Tríceps na polia',
  'Dips - Triceps Version':'Mergulho para tríceps',
  'Skull Crusher':'Tríceps testa',
  'Barbell Hip Thrust':'Elevação pélvica com barra',
  'Crunches':'Abdominal',
  'Plank':'Prancha abdominal',
  'Pushups':'Flexão de braços'
};

function readStore(){try{return JSON.parse(localStorage.getItem(STORE)||'null')}catch{return null}}
function writeStore(data){localStorage.setItem(STORE,JSON.stringify(data));window.dispatchEvent(new Event('mayfit-store-updated'))}
function clean(value){return String(value||'').replaceAll('_',' ').replace(/\s+/g,' ').trim()}
function translated(value){const text=clean(value);return translations[text]||text}

function ensureStyle(){
  if(document.getElementById('mayfit-exercise-rename-style'))return;
  const style=document.createElement('style');
  style.id='mayfit-exercise-rename-style';
  style.textContent=`
  #mse-modal .mse-rename{grid-column:1/-1;width:100%;margin-top:2px;padding:9px 10px!important;border:1px solid #476550!important;border-radius:10px!important;background:#142219!important;color:#9bea62!important;font-size:13px!important;font-weight:900!important}
  @media(min-width:621px){#mse-modal .mse-rename{grid-column:auto;width:auto;min-width:92px;margin:0 0 0 6px}}
  `;
  document.head.appendChild(style);
}

function findExercise(type){
  const store=readStore();
  return store?.exercises?.find(item=>String(item.type)===String(type))||null;
}

function renameExercise(type){
  const store=readStore();
  if(!store||!Array.isArray(store.exercises))return;
  const exercise=store.exercises.find(item=>String(item.type)===String(type));
  if(!exercise)return;
  const current=clean(exercise.name)||translated(exercise.type)||'Exercício';
  const answer=prompt('Digite o nome do exercício:',current);
  if(answer===null)return;
  const name=clean(answer);
  if(!name)return;
  const exercises=store.exercises.map(item=>String(item.id)===String(exercise.id)?{...item,name}:item);
  writeStore({...store,exercises});
  apply();
}

function enhanceRow(row){
  const type=row.dataset.type;
  if(!type)return;
  const title=row.querySelector('.mse-info strong');
  const exercise=findExercise(type);
  if(title){
    const source=exercise?.name||title.textContent||type;
    const name=exercise?.name?clean(exercise.name):translated(source);
    if(name&&title.textContent!==name)title.textContent=name;
  }
  let button=row.querySelector('.mse-rename');
  if(exercise){
    if(!button){
      button=document.createElement('button');
      button.type='button';
      button.className='mse-rename';
      button.textContent='Renomear';
      button.addEventListener('click',event=>{
        event.preventDefault();event.stopPropagation();event.stopImmediatePropagation();
        renameExercise(type);
      },true);
      row.appendChild(button);
    }
  }else button?.remove();
}

function translateAdminNames(){
  document.querySelectorAll('.admin-card').forEach(card=>{
    const title=card.querySelector('.admin-head strong');
    if(!title)return;
    const current=clean(title.textContent);
    const next=translated(current);
    if(next!==current)title.textContent=next;
  });
}

function apply(){
  ensureStyle();
  document.querySelectorAll('#mse-modal .mse-item').forEach(enhanceRow);
  translateAdminNames();
}

let queued=false;
const observer=new MutationObserver(()=>{
  if(queued)return;queued=true;
  requestAnimationFrame(()=>{queued=false;apply()});
});
observer.observe(document.documentElement,{childList:true,subtree:true});
window.addEventListener('mayfit-store-updated',apply);
window.addEventListener('pageshow',apply);
apply();
