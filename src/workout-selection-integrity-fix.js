const STORE='mayfit_v8';

function readStore(){
  try{return JSON.parse(localStorage.getItem(STORE)||'null')}catch{return null}
}

function writeStore(store){
  localStorage.setItem(STORE,JSON.stringify(store));
  window.dispatchEvent(new Event('mayfit-store-updated'));
}

function esc(value){
  return String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
}

function cleanDuplicates(){
  const store=readStore();
  if(!store||!Array.isArray(store.exercises))return;
  const seen=new Set();
  let changed=false;
  const exercises=store.exercises.filter(exercise=>{
    const type=String(exercise?.type||'').trim();
    const id=String(exercise?.id??'').trim();
    const key=type?`type:${type}`:`id:${id}`;
    if(!type&&!id){changed=true;return false}
    if(seen.has(key)){changed=true;return false}
    seen.add(key);
    return true;
  });
  if(changed)writeStore({...store,exercises});
}

function ensureAllSelectedRows(){
  const modal=document.getElementById('mse-modal');
  const list=modal?.querySelector('.mse-list');
  if(!modal||!list)return;
  const store=readStore();
  const exercises=Array.isArray(store?.exercises)?store.exercises:[];
  const existingTypes=new Set([...list.querySelectorAll('.mse-item[data-type]')].map(item=>String(item.dataset.type)));

  exercises.forEach(exercise=>{
    const type=String(exercise?.type||'').trim();
    if(!type||existingTypes.has(type))return;
    const row=document.createElement('article');
    row.className='mse-item mse-saved-only';
    row.dataset.type=type;
    row.innerHTML=`<span class="mse-thumb" aria-hidden="true"></span><span class="mse-info"><strong>${esc(exercise.name||type||'Exercício')}</strong><small>Já está no seu treino</small></span><button type="button" class="mse-action remove" data-action="remove" data-id="${esc(exercise.id??'')}">Remover</button>`;
    list.prepend(row);
    existingTypes.add(type);
  });

  const selected=new Set(exercises.map(exercise=>String(exercise.type||'')).filter(Boolean));
  modal.querySelector('[data-tab="selected"]')?.replaceChildren(document.createTextNode(`Selecionados (${selected.size})`));
}

function removeEveryMatchingExercise(button,item){
  const type=String(item?.dataset.type||'').trim();
  const id=String(button?.dataset.id||'').trim();
  const store=readStore();
  if(!store||!Array.isArray(store.exercises))return false;
  const matches=store.exercises.filter(exercise=>(type&&String(exercise?.type)===type)||(id&&String(exercise?.id)===id));
  if(!matches.length)return false;
  const name=matches[0]?.name||'este exercício';
  if(!confirm(`Remover ${name} do treino?`))return true;
  const exercises=store.exercises.filter(exercise=>!((type&&String(exercise?.type)===type)||(id&&String(exercise?.id)===id)));
  writeStore({...store,exercises});
  item?.remove();
  requestAnimationFrame(()=>{
    ensureAllSelectedRows();
    const modal=document.getElementById('mse-modal');
    const selected=new Set((readStore()?.exercises||[]).map(exercise=>String(exercise.type)).filter(Boolean));
    modal?.querySelector('[data-tab="selected"]')?.replaceChildren(document.createTextNode(`Selecionados (${selected.size})`));
    const footer=modal?.querySelector('.mse-footer');
    if(footer)footer.textContent=`${selected.size} exercício(s) no seu treino`;
    if(!selected.size&&modal?.querySelector('[data-tab="selected"].active')){
      modal.querySelectorAll('.mse-item').forEach(row=>row.classList.add('mse-hidden-by-tab'));
      const list=modal.querySelector('.mse-list');
      if(list&&!list.querySelector('.mse-tab-empty')){
        const empty=document.createElement('div');
        empty.className='mse-tab-empty';
        empty.textContent='Nenhum exercício selecionado.';
        list.appendChild(empty);
      }
    }
  });
  return true;
}

document.addEventListener('click',event=>{
  const button=event.target.closest?.('#mse-modal .mse-action[data-action="remove"]');
  if(!button)return;
  event.preventDefault();
  event.stopPropagation();
  event.stopImmediatePropagation();
  removeEveryMatchingExercise(button,button.closest('.mse-item'));
},true);

let queued=false;
function scheduleSync(){
  if(queued)return;
  queued=true;
  requestAnimationFrame(()=>{queued=false;cleanDuplicates();ensureAllSelectedRows()});
}

cleanDuplicates();
const observer=new MutationObserver(scheduleSync);
observer.observe(document.documentElement,{childList:true,subtree:true});
window.addEventListener('mayfit-store-updated',scheduleSync);
window.addEventListener('pageshow',scheduleSync);
window.addEventListener('storage',event=>{if(event.key===STORE)scheduleSync()});
scheduleSync();
