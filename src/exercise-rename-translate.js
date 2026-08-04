const STORE='mayfit_v8';
const CUSTOM_KEY='mayfit_catalog_custom_names_v1';

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

function clean(value){return String(value||'').replaceAll('_',' ').replace(/\s+/g,' ').trim()}
function translated(value){const text=clean(value);return translations[text]||text}
function readStore(){try{return JSON.parse(localStorage.getItem(STORE)||'null')}catch{return null}}
function writeStore(data){localStorage.setItem(STORE,JSON.stringify(data));window.dispatchEvent(new Event('mayfit-store-updated'))}
function readCustom(){try{return JSON.parse(localStorage.getItem(CUSTOM_KEY)||'{}')||{}}catch{return{}}}
function writeCustom(data){localStorage.setItem(CUSTOM_KEY,JSON.stringify(data))}
function saved(){const store=readStore();return Array.isArray(store?.exercises)?store.exercises:[]}
function displayName(type,fallback){return clean(readCustom()[String(type)])||translated(fallback||type)||'Exercício'}

function renameExercise(type,current){
  const answer=prompt('Digite o novo nome do exercício:',displayName(type,current));
  if(answer===null)return;
  const name=clean(answer);
  if(!name)return;
  const custom=readCustom();
  custom[String(type)]=name;
  writeCustom(custom);
  const store=readStore();
  if(store&&Array.isArray(store.exercises))writeStore({...store,exercises:store.exercises.map(item=>String(item.type)===String(type)?{...item,name}:item)});
  apply();
}

function ensureStyle(){
  if(document.getElementById('mayfit-targeted-fixes-style'))return;
  const style=document.createElement('style');
  style.id='mayfit-targeted-fixes-style';
  style.textContent=`#mse-modal .mse-rename,.exercise-picker .mayfit-picker-rename{grid-column:1/-1;width:100%;margin-top:6px;padding:9px 10px!important;border:1px solid #476550!important;border-radius:10px!important;background:#142219!important;color:#9bea62!important;font-size:13px!important;font-weight:900!important;box-sizing:border-box}.be-modal .be-photo{cursor:pointer!important;pointer-events:auto!important;touch-action:manipulation!important}.be-modal .be-photo img{display:block;width:100%;height:100%;object-fit:cover}`;
  document.head.appendChild(style);
}

function enhanceStudentManager(){
  const modal=document.getElementById('mse-modal');if(!modal)return;
  const exercises=saved();const byType=new Map(exercises.map(item=>[String(item.type),item]));
  modal.querySelectorAll('.mse-item').forEach(row=>{
    const type=String(row.dataset.type||'');if(!type)return;
    const title=row.querySelector('.mse-info strong');if(!title)return;
    const original=row.dataset.originalName||clean(title.textContent);row.dataset.originalName=original;title.textContent=displayName(type,original);
    let rename=row.querySelector('.mse-rename');if(!rename){rename=document.createElement('button');rename.type='button';rename.className='mse-rename';rename.textContent='Renomear';row.appendChild(rename)}rename.dataset.type=type;
    const existing=byType.get(type);const action=row.querySelector('.mse-action[data-action]');const status=row.querySelector('.mse-info small');
    if(action){action.dataset.action=existing?'remove':'add';action.dataset.id=existing?String(existing.id):'';action.classList.toggle('remove',Boolean(existing));action.textContent=existing?'Remover':'Adicionar'}
    if(status)status.textContent=existing?'Já está no seu treino':'Disponível para adicionar';
  });
  const total=exercises.length;const selected=modal.querySelector('[data-tab="selected"]');if(selected)selected.textContent=`Selecionados (${total})`;const footer=modal.querySelector('.mse-footer');if(footer)footer.textContent=`${total} exercício(s) no seu treino`;
}

function enhanceAdminManager(){
  document.querySelectorAll('.exercise-picker .picker-item').forEach(row=>{
    const input=row.querySelector('input[type="checkbox"]');const title=row.querySelector('strong');if(!title)return;
    const type=String(input?.value||row.dataset.type||clean(title.textContent));const original=row.dataset.originalName||clean(title.textContent);row.dataset.type=type;row.dataset.originalName=original;title.textContent=displayName(type,original);
    let rename=row.querySelector('.mayfit-picker-rename');if(!rename){rename=document.createElement('button');rename.type='button';rename.className='mayfit-picker-rename';rename.textContent='Renomear';row.appendChild(rename)}rename.dataset.type=type;
  });
}

function translateVisible(){
  const exercises=saved();const custom=readCustom();
  document.querySelectorAll('.workout-screen .exercise-col>strong,.admin-card .admin-head strong').forEach(title=>{const current=clean(title.textContent);const item=exercises.find(exercise=>clean(exercise.name)===current||clean(exercise.type)===current);title.textContent=item?(clean(custom[String(item.type)])||translated(item.name||item.type)):translated(current)});
}

function preparePhoto(holder){
  if(holder.dataset.photoFixed==='1')return;const input=holder.querySelector('input[type="file"][data-photo]');if(!input)return;holder.dataset.photoFixed='1';input.accept='image/*';
  holder.addEventListener('click',event=>{if(event.target===input)return;event.preventDefault();input.click()});
  input.addEventListener('change',()=>{const file=input.files?.[0];if(!file)return;const url=URL.createObjectURL(file);holder.querySelector('img')?.remove();holder.querySelectorAll('span').forEach(span=>span.remove());const image=document.createElement('img');image.alt='Prévia da foto';image.src=url;image.onload=()=>URL.revokeObjectURL(url);holder.prepend(image);holder.appendChild(input)});
}

function restorePhotos(){
  document.querySelectorAll('.be-modal .be-photo').forEach(holder=>{const input=holder.querySelector('input[type="file"][data-photo]');if(input&&!clean(holder.textContent)&&!holder.querySelector('img')){const label=document.createElement('span');label.textContent='Adicionar foto';holder.prepend(label)}preparePhoto(holder)});
}

function apply(){ensureStyle();enhanceStudentManager();enhanceAdminManager();translateVisible();restorePhotos()}

document.addEventListener('click',event=>{const button=event.target.closest?.('.mse-rename,.mayfit-picker-rename');if(!button)return;event.preventDefault();event.stopPropagation();event.stopImmediatePropagation();const row=button.closest('.mse-item,.picker-item');renameExercise(button.dataset.type,row?.dataset.originalName||row?.querySelector('strong')?.textContent||'Exercício')},true);

document.addEventListener('click',event=>{const add=event.target.closest?.('#mse-modal .mse-action[data-action="add"]');if(!add)return;const type=String(add.closest('.mse-item')?.dataset.type||'');const customName=readCustom()[type];if(!customName)return;setTimeout(()=>{const store=readStore();if(store&&Array.isArray(store.exercises))writeStore({...store,exercises:store.exercises.map(item=>String(item.type)===type?{...item,name:customName}:item)})},100)},true);

let queued=false;const observer=new MutationObserver(()=>{if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;apply()})});observer.observe(document.documentElement,{childList:true,subtree:true});window.addEventListener('mayfit-store-updated',apply);window.addEventListener('pageshow',apply);apply();
