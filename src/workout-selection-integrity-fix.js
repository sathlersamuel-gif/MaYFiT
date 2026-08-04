const STORE='mayfit_v8';

function readStore(){
  try{return JSON.parse(localStorage.getItem(STORE)||'null')}catch{return null}
}

function writeStore(store){
  localStorage.setItem(STORE,JSON.stringify(store));
  window.dispatchEvent(new Event('mayfit-store-updated'));
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
  button.dataset.action='add';
  button.dataset.id='';
  button.classList.remove('remove');
  button.textContent='Adicionar';
  const info=item?.querySelector('.mse-info small');
  if(info)info.textContent='Disponível para adicionar';
  item?.querySelectorAll('.mse-rename').forEach(control=>control.remove());
  requestAnimationFrame(()=>{
    const modal=item?.closest('#mse-modal');
    const selected=new Set((readStore()?.exercises||[]).map(exercise=>String(exercise.type)));
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

cleanDuplicates();
window.addEventListener('pageshow',cleanDuplicates);
window.addEventListener('storage',event=>{if(event.key===STORE)cleanDuplicates()});
