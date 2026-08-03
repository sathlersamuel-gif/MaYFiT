const STORE='mayfit_v8';
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

const englishWords={
  barbell:'barra',dumbbell:'halter',cable:'polia',machine:'máquina',bench:'banco',press:'press',
  squat:'agachamento',deadlift:'levantamento terra',row:'remada',pulldown:'puxada',pullups:'barra fixa',
  curl:'rosca',curls:'rosca',extension:'extensão',extensions:'extensão',raise:'elevação',raises:'elevação',
  calf:'panturrilha',leg:'perna',shoulder:'ombro',chest:'peito',back:'costas',biceps:'bíceps',triceps:'tríceps',
  seated:'sentado',standing:'em pé',lying:'deitado',incline:'inclinado',decline:'declinado',front:'frontal',
  rear:'posterior',wide:'aberta',close:'fechada',grip:'pegada',one:'um',arm:'braço',alternating:'alternado',with:'com'
};

function readStore(){try{return JSON.parse(localStorage.getItem(STORE)||'null')}catch{return null}}
function writeStore(store){localStorage.setItem(STORE,JSON.stringify(store));window.dispatchEvent(new Event('mayfit-store-updated'))}
function esc(value){return String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]))}
function normalizeName(value){return String(value||'').replaceAll('_',' ').replace(/\s+/g,' ').trim()}
function isCorrupted(value){const text=String(value||'');return text.length>90||/(?:ÃO|Ãƒ|Ã‚|PRESSÃO){4,}/i.test(text)||/(.{2,6})\1{5,}/i.test(text)}
function looksEnglish(value){return /\b(barbell|dumbbell|cable|machine|bench|press|squat|deadlift|row|pulldown|pullups|curl|extension|raise|calf|leg|shoulder|chest|back|biceps|triceps|seated|standing|lying|incline|decline|front|rear|grip|arm|with)\b/i.test(value)}
function titleCase(value){return value?value.charAt(0).toUpperCase()+value.slice(1):'Exercício'}
function translateSafe(value){
  const original=normalizeName(value);
  if(!original)return 'Exercício';
  const exact=exactTranslations[original]||exactTranslations[original.replace(/ - /g,' ')];
  if(exact)return exact;
  if(!looksEnglish(original))return original;
  const translated=original.split(/([\s-]+)/).map(part=>englishWords[part.toLowerCase()]||part).join('').replace(/\s+/g,' ').trim();
  return titleCase(translated);
}
function repairedName(item){
  const current=normalizeName(item?.name);
  const typeName=normalizeName(item?.type);
  if(isCorrupted(current))return translateSafe(typeName);
  return translateSafe(current||typeName);
}

function scheduleReload(){
  if(reloadScheduled)return;
  reloadScheduled=true;
  setTimeout(()=>location.reload(),100);
}

function repairStoredNames(){
  const store=readStore();
  if(!store||!Array.isArray(store.exercises))return;
  let changed=false;
  const exercises=store.exercises.map(item=>{
    const name=repairedName(item);
    if(name&&name!==item.name){changed=true;return {...item,name}}
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
  if(!confirm(`Remover ${repairedName(exercise)} do treino?`))return;
  writeStore({...store,exercises:store.exercises.filter(item=>String(item.id)!==String(id))});
}

function renderSelectedPanel(modal){
  const search=modal.querySelector('.mse-search');
  if(!search)return;
  let panel=modal.querySelector('.mse-selected-panel');
  if(!panel){panel=document.createElement('section');panel.className='mse-selected-panel';search.before(panel)}
  const exercises=readStore()?.exercises||[];
  panel.innerHTML=`<div class="mse-selected-head"><strong>Já selecionados</strong><span>${exercises.length} exercício(s)</span></div><div class="mse-selected-list">${exercises.length?exercises.map(item=>`<div class="mse-selected-chip"><span>${esc(repairedName(item))}</span><button type="button" data-remove-selected="${esc(item.id)}" aria-label="Remover exercício">×</button></div>`).join(''):'<div class="mse-empty-selected">Nenhum exercício selecionado.</div>'}</div>`;
  panel.querySelectorAll('[data-remove-selected]').forEach(button=>button.onclick=()=>removeSelectedExercise(button.dataset.removeSelected));
}

function enhanceManager(){const modal=document.getElementById('mse-modal');if(modal)renderSelectedPanel(modal)}

ensureStyles();
repairStoredNames();
const observer=new MutationObserver(()=>requestAnimationFrame(enhanceManager));
observer.observe(document.documentElement,{childList:true,subtree:true});
window.addEventListener('mayfit-store-updated',scheduleReload);
window.addEventListener('storage',event=>{if(event.key===STORE)scheduleReload()});
window.addEventListener('pageshow',enhanceManager);
enhanceManager();
