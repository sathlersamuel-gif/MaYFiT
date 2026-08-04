const STORE='mayfit_v8';
const CATALOG_NAMES_KEY='mayfit_catalog_custom_names_v1';

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
function readCustomNames(){try{return JSON.parse(localStorage.getItem(CATALOG_NAMES_KEY)||'{}')||{}}catch{return {}}}
function writeCustomNames(data){localStorage.setItem(CATALOG_NAMES_KEY,JSON.stringify(data))}
function clean(value){return String(value||'').replaceAll('_',' ').replace(/\s+/g,' ').trim()}
function translate(value){const text=clean(value);return translations[text]||text}
function esc(value){return String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function exercises(){const store=readStore();return Array.isArray(store?.exercises)?store.exercises:[]}
function exerciseByType(type){return exercises().find(item=>String(item.type)===String(type))||null}
function customName(type,fallback=''){return clean(readCustomNames()[String(type)])||translate(fallback||type)}

function ensureStyle(){
  if(document.getElementById('mayfit-manager-consistency-style'))return;
  const style=document.createElement('style');
  style.id='mayfit-manager-consistency-style';
  style.textContent=`
    #mse-modal .mse-rename,.exercise-picker .mayfit-picker-rename{width:100%;margin-top:7px;padding:9px 10px!important;border:1px solid #476550!important;border-radius:10px!important;background:#142219!important;color:#9bea62!important;font-size:13px!important;font-weight:900!important;box-sizing:border-box}
    #mse-modal .mse-item.mse-restored-selected{border-color:#55705c!important}
    .exercise-picker .picker-item{position:relative!important}
    .exercise-picker .picker-item .mayfit-picker-rename{grid-column:1/-1}
  `;
  document.head.appendChild(style);
}

function renameCatalog(type,currentLabel){
  const current=customName(type,currentLabel)||'Exercício';
  const answer=prompt('Digite o novo nome do exercício:',current);
  if(answer===null)return;
  const name=clean(answer);
  if(!name)return;
  const names=readCustomNames();
  names[String(type)]=name;
  writeCustomNames(names);

  const store=readStore();
  if(store&&Array.isArray(store.exercises)){
    const updated=store.exercises.map(item=>String(item.type)===String(type)?{...item,name}:item);
    writeStore({...store,exercises:updated});
  }
  apply();
}

function applyCustomNamesToStore(types){
  const store=readStore();
  if(!store||!Array.isArray(store.exercises))return;
  const wanted=new Set((types||[]).map(String));
  const names=readCustomNames();
  let changed=false;
  const updated=store.exercises.map(item=>{
    const name=names[String(item.type)];
    if(name&&(!wanted.size||wanted.has(String(item.type)))&&item.name!==name){changed=true;return {...item,name}}
    return item;
  });
  if(changed)writeStore({...store,exercises:updated});
}

function enhanceStudentManager(){
  const modal=document.getElementById('mse-modal');
  if(!modal)return;
  const list=modal.querySelector('.mse-list');
  if(!list)return;

  const existingTypes=new Set([...list.querySelectorAll('.mse-item')].map(row=>String(row.dataset.type||'')));
  for(const exercise of exercises()){
    const type=String(exercise.type||'');
    if(!type||existingTypes.has(type))continue;
    const row=document.createElement('article');
    row.className='mse-item mse-restored-selected';
    row.dataset.type=type;
    row.innerHTML=`<span class="mse-thumb" aria-hidden="true"></span><span class="mse-info"><strong>${esc(customName(type,exercise.name)||'Exercício')}</strong><small>Já está no seu treino</small></span><button type="button" class="mse-action remove" data-action="remove" data-id="${esc(exercise.id)}">Remover</button>`;
    list.prepend(row);
    existingTypes.add(type);
  }

  modal.querySelectorAll('.mse-item').forEach(row=>{
    const type=String(row.dataset.type||'');
    if(!type)return;
    const title=row.querySelector('.mse-info strong');
    const original=row.dataset.originalName||clean(title?.textContent||type);
    row.dataset.originalName=original;
    if(title)title.textContent=customName(type,original);
    let rename=row.querySelector('.mse-rename');
    if(!rename){
      rename=document.createElement('button');
      rename.type='button';
      rename.className='mse-rename';
      rename.textContent='Renomear';
      rename.dataset.type=type;
      row.appendChild(rename);
    }
  });

  const total=exercises().length;
  const selected=modal.querySelector('[data-tab="selected"]');
  if(selected)selected.textContent=`Selecionados (${total})`;
}

function enhanceAdminPicker(){
  const picker=document.querySelector('.exercise-picker-overlay .exercise-picker');
  if(!picker)return;
  picker.querySelectorAll('.picker-item').forEach(item=>{
    const input=item.querySelector('input[type="checkbox"]');
    const title=item.querySelector('strong');
    if(!title)return;
    const type=String(input?.value||item.dataset.type||'');
    const original=item.dataset.originalName||clean(title.textContent);
    item.dataset.originalName=original;
    if(type)item.dataset.type=type;
    title.textContent=customName(type||original,original);

    let rename=item.querySelector('.mayfit-picker-rename');
    if(!rename){
      rename=document.createElement('button');
      rename.type='button';
      rename.className='mayfit-picker-rename';
      rename.textContent='Renomear';
      rename.dataset.type=type||original;
      item.appendChild(rename);
    }
  });
}

function apply(){ensureStyle();enhanceStudentManager();enhanceAdminPicker()}

document.addEventListener('click',event=>{
  const rename=event.target.closest?.('.mse-rename,.mayfit-picker-rename');
  if(rename){
    event.preventDefault();event.stopPropagation();event.stopImmediatePropagation();
    const holder=rename.closest('.mse-item,.picker-item');
    renameCatalog(rename.dataset.type,holder?.dataset.originalName||holder?.querySelector('strong')?.textContent||'Exercício');
    return;
  }

  const studentAdd=event.target.closest?.('#mse-modal .mse-action[data-action="add"]');
  if(studentAdd){
    const type=studentAdd.closest('.mse-item')?.dataset.type;
    if(type)setTimeout(()=>applyCustomNamesToStore([type]),80);
    return;
  }

  const adminAdd=event.target.closest?.('.exercise-picker .picker-footer .primary');
  if(adminAdd){
    const types=[...document.querySelectorAll('.exercise-picker .picker-item input[type="checkbox"]:checked')].map(input=>String(input.value||input.closest('.picker-item')?.dataset.type||'')).filter(Boolean);
    setTimeout(()=>applyCustomNamesToStore(types),120);
  }
},true);

let queued=false;
const observer=new MutationObserver(()=>{
  if(queued)return;
  queued=true;
  requestAnimationFrame(()=>{queued=false;apply()});
});
observer.observe(document.documentElement,{childList:true,subtree:true});
window.addEventListener('mayfit-store-updated',apply);
window.addEventListener('pageshow',apply);
apply();
