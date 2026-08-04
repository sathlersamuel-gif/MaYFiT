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

function cleanStoredExercises(){
  const store=readStore();
  if(!store||!Array.isArray(store.exercises))return [];
  const seen=new Set();
  let changed=false;
  const exercises=store.exercises.filter(exercise=>{
    const type=String(exercise?.type||'').trim();
    const id=String(exercise?.id??'').trim();
    if(!type&&!id){changed=true;return false}
    const key=type?`type:${type}`:`id:${id}`;
    if(seen.has(key)){changed=true;return false}
    seen.add(key);
    return true;
  });
  if(changed)writeStore({...store,exercises});
  return exercises;
}

function selectedPanel(modal){
  let panel=modal.querySelector('.mse-selected-complete');
  if(panel)return panel;
  panel=document.createElement('div');
  panel.className='mse-selected-complete';
  panel.style.cssText='display:none;gap:8px;padding:0 15px 15px;overflow:auto';
  const list=modal.querySelector('.mse-list');
  list?.insertAdjacentElement('beforebegin',panel);
  return panel;
}

function renderSelected(modal){
  if(!modal)return;
  const exercises=cleanStoredExercises();
  const panel=selectedPanel(modal);
  const list=modal.querySelector('.mse-list');
  const selectedTab=modal.querySelector('[data-tab="selected"]');
  const selectedActive=selectedTab?.classList.contains('active');

  selectedTab?.replaceChildren(document.createTextNode(`Selecionados (${exercises.length})`));
  const footer=modal.querySelector('.mse-footer');
  if(footer)footer.textContent=`${exercises.length} exercício(s) no seu treino`;

  panel.innerHTML=exercises.map(exercise=>{
    const type=String(exercise?.type||'').trim();
    const id=String(exercise?.id??'').trim();
    const name=String(exercise?.name||type||'Exercício').trim();
    return `<article class="mse-item" data-type="${esc(type)}" style="display:grid"><span class="mse-thumb" aria-hidden="true"></span><span class="mse-info"><strong>${esc(name)}</strong><small>Já está no seu treino</small></span><button type="button" class="mse-action remove mse-force-remove" data-action="remove" data-id="${esc(id)}">Remover</button></article>`;
  }).join('')||'<div class="mse-tab-empty">Nenhum exercício selecionado.</div>';

  panel.style.display=selectedActive?'grid':'none';
  if(list)list.style.display=selectedActive?'none':'grid';
}

function removeStoredExercise(button){
  const item=button.closest('.mse-item');
  const type=String(item?.dataset.type||'').trim();
  const id=String(button.dataset.id||'').trim();
  const store=readStore();
  if(!store||!Array.isArray(store.exercises))return;
  const found=store.exercises.find(exercise=>(type&&String(exercise?.type)===type)||(id&&String(exercise?.id)===id));
  if(!found)return;
  if(!confirm(`Remover ${found.name||'este exercício'} do treino?`))return;
  const exercises=store.exercises.filter(exercise=>!((type&&String(exercise?.type)===type)||(id&&String(exercise?.id)===id)));
  writeStore({...store,exercises});
  renderSelected(document.getElementById('mse-modal'));
}

document.addEventListener('click',event=>{
  const forced=event.target.closest?.('#mse-modal .mse-force-remove');
  if(forced){
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
    removeStoredExercise(forced);
    return;
  }
  const tab=event.target.closest?.('#mse-modal .mse-tab');
  if(tab)setTimeout(()=>renderSelected(document.getElementById('mse-modal')),0);
},true);

let queued=false;
function sync(){
  if(queued)return;
  queued=true;
  requestAnimationFrame(()=>{
    queued=false;
    const modal=document.getElementById('mse-modal');
    if(modal)renderSelected(modal);
  });
}

cleanStoredExercises();
const observer=new MutationObserver(sync);
observer.observe(document.documentElement,{childList:true,subtree:true});
window.addEventListener('mayfit-store-updated',sync);
window.addEventListener('pageshow',sync);
window.addEventListener('storage',event=>{if(event.key===STORE)sync()});
sync();
