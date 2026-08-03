const STORE='mayfit_v8';
let reloadScheduled=false;
let activeTab='all';

const exactTranslations={
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
function normalizeName(value){return String(value||'').replaceAll('_',' ').replace(/\s+/g,' ').trim()}
function isCorrupted(value){const text=String(value||'');return text.length>90||/(?:ÃO|Ãƒ|Ã‚|PRESSÃO){4,}/i.test(text)||/(.{2,6})\1{5,}/i.test(text)}
function repairedName(item){
  const current=normalizeName(item?.name);
  const type=normalizeName(item?.type);
  if(isCorrupted(current))return exactTranslations[type]||type||'Exercício';
  return exactTranslations[current]||current||exactTranslations[type]||type||'Exercício';
}

function repairStoredNames(){
  const store=readStore();
  if(!store||!Array.isArray(store.exercises))return;
  let changed=false;
  const exercises=store.exercises.map(item=>{const name=repairedName(item);if(name!==item.name){changed=true;return {...item,name}}return item});
  if(changed)localStorage.setItem(STORE,JSON.stringify({...store,exercises}));
}

function scheduleReload(){
  if(reloadScheduled)return;
  reloadScheduled=true;
  setTimeout(()=>location.reload(),100);
}

function ensureStyles(){
  document.getElementById('mayfit-selected-workouts-style')?.remove();
  if(document.getElementById('mayfit-workout-tabs-style'))return;
  const style=document.createElement('style');
  style.id='mayfit-workout-tabs-style';
  style.textContent=`
  #mse-modal .mse-tabs{display:grid;grid-template-columns:1fr 1fr;gap:6px;margin:12px 15px 0;padding:4px;border:1px solid #334d3a;border-radius:14px;background:#0a120d}
  #mse-modal .mse-tab{height:42px;padding:0 10px!important;border:0!important;border-radius:10px!important;background:transparent!important;color:#aab8ae!important;font-size:14px!important;font-weight:900!important}
  #mse-modal .mse-tab.active{background:#78d532!important;color:#07110c!important;box-shadow:0 3px 12px rgba(120,213,50,.24)!important}
  #mse-modal .mse-item.mse-hidden-by-tab{display:none!important}
  #mse-modal .mse-tab-empty{padding:26px 16px;text-align:center;color:#9cac9f;font-size:14px}
  @media(max-width:620px){#mse-modal .mse-tabs{margin:10px 12px 0}.mse-card .mse-search{margin-top:10px!important}}
  `;
  document.head.appendChild(style);
}

function selectedTypes(){return new Set((readStore()?.exercises||[]).map(item=>String(item.type)))}

function applyTab(modal){
  const list=modal.querySelector('.mse-list');
  if(!list)return;
  const selected=selectedTypes();
  let visible=0;
  list.querySelectorAll('.mse-item').forEach(item=>{
    const show=activeTab==='all'||selected.has(String(item.dataset.type));
    item.classList.toggle('mse-hidden-by-tab',!show);
    if(show)visible++;
  });
  let empty=list.querySelector('.mse-tab-empty');
  if(activeTab==='selected'&&visible===0){
    if(!empty){empty=document.createElement('div');empty.className='mse-tab-empty';empty.textContent='Nenhum exercício selecionado.';list.appendChild(empty)}
  }else empty?.remove();
  const count=selected.size;
  modal.querySelector('[data-tab="selected"]')?.replaceChildren(document.createTextNode(`Selecionados (${count})`));
  modal.querySelectorAll('.mse-tab').forEach(button=>button.classList.toggle('active',button.dataset.tab===activeTab));
}

function installTabs(modal){
  modal.querySelector('.mse-selected-panel')?.remove();
  const search=modal.querySelector('.mse-search');
  if(!search)return;
  let tabs=modal.querySelector('.mse-tabs');
  if(!tabs){
    tabs=document.createElement('div');
    tabs.className='mse-tabs';
    tabs.innerHTML='<button type="button" class="mse-tab" data-tab="all">Todos</button><button type="button" class="mse-tab" data-tab="selected">Selecionados (0)</button>';
    search.before(tabs);
    tabs.addEventListener('click',event=>{
      const button=event.target.closest('.mse-tab');if(!button)return;
      activeTab=button.dataset.tab;
      applyTab(modal);
    });
  }
  applyTab(modal);
}

function enhanceManager(){const modal=document.getElementById('mse-modal');if(modal)installTabs(modal)}

repairStoredNames();
ensureStyles();
const observer=new MutationObserver(()=>requestAnimationFrame(enhanceManager));
observer.observe(document.documentElement,{childList:true,subtree:true});
window.addEventListener('mayfit-store-updated',scheduleReload);
window.addEventListener('storage',event=>{if(event.key===STORE)scheduleReload()});
window.addEventListener('pageshow',enhanceManager);
enhanceManager();
