const STORE='mayfit_v8';

const translations={
  '3/4 Sit-Up':'Abdominal 3/4','90/90 Hamstring':'Alongamento posterior 90/90','Ab Crunch Machine':'Abdominal na máquina','Ab Roller':'Roda abdominal',
  'Barbell Bench Press - Medium Grip':'Supino reto com barra','Barbell Bench Press':'Supino reto com barra','Dumbbell Bench Press':'Supino reto com halteres',
  'Incline Barbell Bench Press':'Supino inclinado com barra','Incline Dumbbell Press':'Supino inclinado com halteres','Decline Barbell Bench Press':'Supino declinado com barra',
  'Barbell Squat':'Agachamento com barra','Front Barbell Squat':'Agachamento frontal com barra','Leg Press':'Leg press','Leg Extensions':'Cadeira extensora',
  'Lying Leg Curls':'Mesa flexora','Seated Leg Curl':'Cadeira flexora','Standing Calf Raises':'Panturrilha em pé','Seated Calf Raise':'Panturrilha sentado',
  'Barbell Deadlift':'Levantamento terra com barra','Romanian Deadlift':'Levantamento terra romeno','Seated Cable Rows':'Remada baixa na polia',
  'Bent Over Barbell Row':'Remada curvada com barra','Wide-Grip Lat Pulldown':'Puxada frontal aberta','Close-Grip Front Lat Pulldown':'Puxada frontal fechada',
  'Pullups':'Barra fixa','Chin-Up':'Barra fixa supinada','Dumbbell Shoulder Press':'Desenvolvimento com halteres','Military Press':'Desenvolvimento militar',
  'Side Lateral Raise':'Elevação lateral','Front Dumbbell Raise':'Elevação frontal com halteres','Barbell Curl':'Rosca direta com barra',
  'Dumbbell Bicep Curl':'Rosca bíceps com halteres','Hammer Curls':'Rosca martelo','Preacher Curl':'Rosca Scott','Triceps Pushdown':'Tríceps na polia',
  'Dips - Triceps Version':'Mergulho para tríceps','Skull Crusher':'Tríceps testa','Barbell Hip Thrust':'Elevação pélvica com barra',
  'Crunches':'Abdominal','Plank':'Prancha abdominal','Pushups':'Flexão de braços'
};

function readStore(){try{return JSON.parse(localStorage.getItem(STORE)||'null')}catch{return null}}
function writeStore(store){localStorage.setItem(STORE,JSON.stringify(store));window.dispatchEvent(new Event('mayfit-store-updated'))}
function clean(value){return String(value||'').replaceAll('_',' ').replace(/\s+/g,' ').trim()}
function translate(value){const text=clean(value);return translations[text]||text}
function esc(value){return String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]))}

function ensureStyle(){
  if(document.getElementById('mayfit-manager-consistency-style'))return;
  const style=document.createElement('style');
  style.id='mayfit-manager-consistency-style';
  style.textContent=`
    #mse-modal .mse-rename{grid-column:1/-1;width:100%;padding:9px 10px!important;border:1px solid #476550!important;border-radius:10px!important;background:#142219!important;color:#9bea62!important;font-size:13px!important;font-weight:900!important}
    #mse-modal .mse-item.mse-restored-selected{border-color:#55705c!important}
    @media(min-width:621px){#mse-modal .mse-rename{grid-column:auto;width:auto;min-width:92px}}
  `;
  document.head.appendChild(style);
}

function storedExercises(){const store=readStore();return Array.isArray(store?.exercises)?store.exercises:[]}
function exerciseByType(type){return storedExercises().find(item=>String(item.type)===String(type))||null}

function addRenameButton(row,exercise){
  let button=row.querySelector('.mse-rename');
  if(!exercise){button?.remove();return}
  if(button)return;
  button=document.createElement('button');
  button.type='button';button.className='mse-rename';button.textContent='Renomear';button.dataset.renameType=String(exercise.type);
  row.appendChild(button);
}

function normalizeVisibleRows(modal){
  modal.querySelectorAll('.mse-item').forEach(row=>{
    const type=String(row.dataset.type||'');if(!type)return;
    const exercise=exerciseByType(type);
    const title=row.querySelector('.mse-info strong');
    if(title){const desired=exercise?.name?clean(exercise.name):translate(title.textContent||type);if(desired)title.textContent=desired}
    addRenameButton(row,exercise);
  });
}

function injectMissingSelectedRows(modal){
  const list=modal.querySelector('.mse-list');if(!list)return;
  const existingTypes=new Set([...list.querySelectorAll('.mse-item')].map(row=>String(row.dataset.type||'')));
  for(const exercise of storedExercises()){
    const type=String(exercise.type||'');if(!type||existingTypes.has(type))continue;
    const row=document.createElement('article');
    row.className='mse-item mse-restored-selected';row.dataset.type=type;
    row.innerHTML=`<span class="mse-thumb" aria-hidden="true"></span><span class="mse-info"><strong>${esc(clean(exercise.name)||translate(type)||'Exercício')}</strong><small>Já está no seu treino</small></span><button type="button" class="mse-action remove" data-action="remove" data-id="${esc(exercise.id)}">Remover</button>`;
    addRenameButton(row,exercise);list.prepend(row);existingTypes.add(type);
  }
}

function refreshCounts(modal){
  const total=storedExercises().length;
  const selected=modal.querySelector('[data-tab="selected"]');if(selected)selected.textContent=`Selecionados (${total})`;
  const footer=modal.querySelector('.mse-footer');if(footer){const shown=modal.querySelectorAll('.mse-item').length;footer.textContent=`${total} exercício(s) no seu treino • ${shown} exibido(s)`}
}

function apply(){
  ensureStyle();
  const modal=document.getElementById('mse-modal');if(!modal)return;
  injectMissingSelectedRows(modal);normalizeVisibleRows(modal);refreshCounts(modal);
  const selectedActive=modal.querySelector('[data-tab="selected"].active');
  if(selectedActive){const selectedTypes=new Set(storedExercises().map(item=>String(item.type)));modal.querySelectorAll('.mse-item').forEach(row=>row.classList.toggle('mse-hidden-by-tab',!selectedTypes.has(String(row.dataset.type))))}
}

function rename(type){
  const store=readStore();if(!store||!Array.isArray(store.exercises))return;
  const exercise=store.exercises.find(item=>String(item.type)===String(type));if(!exercise)return;
  const answer=prompt('Digite o novo nome do exercício:',clean(exercise.name)||translate(exercise.type)||'Exercício');if(answer===null)return;
  const name=clean(answer);if(!name)return;
  writeStore({...store,exercises:store.exercises.map(item=>String(item.id)===String(exercise.id)?{...item,name}:item)});apply();
}

document.addEventListener('click',event=>{
  const button=event.target.closest?.('#mse-modal .mse-rename');if(!button)return;
  event.preventDefault();event.stopPropagation();event.stopImmediatePropagation();rename(button.dataset.renameType);
},true);

let queued=false;
const observer=new MutationObserver(()=>{if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;apply()})});
observer.observe(document.documentElement,{childList:true,subtree:true});
window.addEventListener('mayfit-store-updated',()=>requestAnimationFrame(apply));
window.addEventListener('pageshow',apply);
apply();
