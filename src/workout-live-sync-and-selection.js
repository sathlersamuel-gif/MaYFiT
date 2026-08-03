const STORE='mayfit_v8';
const USER_KEY='mayfit_user';
let reloadScheduled=false;

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

const replacements=[
  [/\bbarbell\b/gi,'barra'],[/\bdumbbell\b/gi,'halter'],[/\bcable\b/gi,'polia'],
  [/\bmachine\b/gi,'máquina'],[/\bbench press\b/gi,'supino'],[/\bpress\b/gi,'pressão'],
  [/\bsquat\b/gi,'agachamento'],[/\bdeadlift\b/gi,'levantamento terra'],[/\brow\b/gi,'remada'],
  [/\bpulldown\b/gi,'puxada'],[/\bpull-up(s)?\b/gi,'barra fixa'],[/\bchin-up(s)?\b/gi,'barra fixa supinada'],
  [/\bcurl(s)?\b/gi,'rosca'],[/\bextension(s)?\b/gi,'extensão'],[/\braise(s)?\b/gi,'elevação'],
  [/\bcalf\b/gi,'panturrilha'],[/\bleg\b/gi,'perna'],[/\bshoulder\b/gi,'ombro'],
  [/\bchest\b/gi,'peito'],[/\bback\b/gi,'costas'],[/\bbiceps?\b/gi,'bíceps'],[/\btriceps?\b/gi,'tríceps'],
  [/\bseated\b/gi,'sentado'],[/\bstanding\b/gi,'em pé'],[/\blying\b/gi,'deitado'],
  [/\bincline\b/gi,'inclinado'],[/\bdecline\b/gi,'declinado'],[/\bfront\b/gi,'frontal'],
  [/\brear\b/gi,'posterior'],[/\bwide[- ]grip\b/gi,'pegada aberta'],[/\bclose[- ]grip\b/gi,'pegada fechada'],
  [/\bone arm\b/gi,'unilateral'],[/\balternating\b/gi,'alternado'],[/\bwith\b/gi,'com']
];

function currentUser(){try{return JSON.parse(sessionStorage.getItem(USER_KEY)||'null')}catch{return null}}
function readStore(){try{return JSON.parse(localStorage.getItem(STORE)||'null')}catch{return null}}
function writeStore(store){localStorage.setItem(STORE,JSON.stringify(store));window.dispatchEvent(new Event('mayfit-store-updated'))}
function esc(value){return String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]))}
function normalizeName(value){return String(value||'').replaceAll('_',' ').replace(/\s+/g,' ').trim()}
function translateName(value){
  const original=normalizeName(value);
  if(!original)return 'Exercício';
  const exact=exactTranslations[original]||exactTranslations[original.replace(/ - /g,' ')];
  if(exact)return exact;
  let translated=original;
  replacements.forEach(([pattern,replacement])=>{translated=translated.replace(pattern,replacement)});
  translated=translated.replace(/\s+-\s+/g,' – ').replace(/\s+/g,' ').trim();
  return translated.charAt(0).toUpperCase()+translated.slice(1);
}

function scheduleReload(){
  if(reloadScheduled)return;
  reloadScheduled=true;
  sessionStorage.setItem('mayfit_live_refresh','1');
  setTimeout(()=>location.reload(),80);
}

function migrateStoredNames(){
  const store=readStore();
  if(!store||!Array.isArray(store.exercises))return;
  let changed=false;
  const exercises=store.exercises.map(item=>{
    const translated=translateName(item.name||item.type);
    if(translated&&translated!==item.name){changed=true;return {...item,name:translated}}
    return item;
  });
  if(changed)localStorage.setItem(STORE,JSON.stringify({...store,exercises}));
}

function ensureStyles(){
  if(document.getElementById('mayfit-selected-workouts-style'))return;
  const style=document.createElement('style');
  style.id='mayfit-selected-workouts-style';
  style.textContent=`
  #mse-modal .mse-selected-panel{margin:12px 15px 0;padding:13px;border:1px solid #456a50;border-radius:15px;background:#122019}
  #mse-modal .mse-selected-head{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:9px}
  #mse-modal .mse-selected-head strong{font-size:15px;color:#fff}#mse-modal .mse-selected-head span{color:#9cac9f;font-size:12px}
  #mse-modal .mse-selected-list{display:flex;flex-wrap:wrap;gap:7px;max-height:150px;overflow:auto}
  #mse-modal .mse-selected-chip{display:flex;align-items:center;gap:7px;max-width:100%;padding:8px 9px;border:1px solid #54775e;border-radius:11px;background:#1a2b20;color:#fff}
  #mse-modal .mse-selected-chip span{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:13px;font-weight:800}
  #mse-modal .mse-selected-chip button{flex:0 0 auto;width:27px;height:27px;min-width:27px;padding:0!important;border:1px solid #8b4141!important;border-radius:8px!important;background:#4a2020!important;color:#ffd0d0!important;font-size:17px!important;line-height:1!important}
  #mse-modal .mse-empty-selected{color:#9cac9f;font-size:13px}
  @media(max-width:620px){#mse-modal .mse-selected-panel{margin:10px 12px 0;padding:11px}#mse-modal .mse-selected-list{max-height:125px}.mse-card .mse-search{margin-top:10px!important}}
  `;
  document.head.appendChild(style);
}

function removeSelectedExercise(id){
  const store=readStore();
  if(!store||!Array.isArray(store.exercises))return;
  const exercise=store.exercises.find(item=>String(item.id)===String(id));
  if(!exercise)return;
  if(!confirm(`Remover ${translateName(exercise.name||exercise.type)} do treino?`))return;
  writeStore({...store,exercises:store.exercises.filter(item=>String(item.id)!==String(id))});
}

function renderSelectedPanel(modal){
  const card=modal.querySelector('.mse-card');
  const search=modal.querySelector('.mse-search');
  if(!card||!search)return;
  let panel=modal.querySelector('.mse-selected-panel');
  if(!panel){panel=document.createElement('section');panel.className='mse-selected-panel';search.before(panel)}
  const exercises=readStore()?.exercises||[];
  panel.innerHTML=`<div class="mse-selected-head"><strong>Já selecionados</strong><span>${exercises.length} exercício(s)</span></div><div class="mse-selected-list">${exercises.length?exercises.map(item=>`<div class="mse-selected-chip"><span>${esc(translateName(item.name||item.type))}</span><button type="button" data-remove-selected="${esc(item.id)}" aria-label="Remover exercício">×</button></div>`).join(''):'<div class="mse-empty-selected">Nenhum exercício selecionado.</div>'}</div>`;
  panel.querySelectorAll('[data-remove-selected]').forEach(button=>button.onclick=()=>removeSelectedExercise(button.dataset.removeSelected));
}

function translateVisibleNames(root=document){
  root.querySelectorAll('#mse-modal .mse-info strong,.workout-screen .exercise-col>strong').forEach(node=>{
    const translated=translateName(node.textContent);
    if(translated&&translated!==node.textContent)node.textContent=translated;
  });
}

function enhanceManager(){
  const modal=document.getElementById('mse-modal');
  if(!modal)return;
  renderSelectedPanel(modal);
  translateVisibleNames(modal);
}

ensureStyles();
migrateStoredNames();
const observer=new MutationObserver(()=>requestAnimationFrame(()=>{enhanceManager();translateVisibleNames()}));
observer.observe(document.documentElement,{childList:true,subtree:true});
window.addEventListener('mayfit-store-updated',scheduleReload);
window.addEventListener('storage',event=>{if(event.key===STORE)scheduleReload()});
window.addEventListener('pageshow',()=>{enhanceManager();translateVisibleNames()});
enhanceManager();translateVisibleNames();
