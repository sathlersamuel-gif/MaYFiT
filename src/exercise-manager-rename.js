const STORE='mayfit_v8';
const CUSTOM_KEY='mayfit_custom_exercise_names_v1';

function clean(value){return String(value||'').replace(/\s+/g,' ').trim()}
function readStore(){try{return JSON.parse(localStorage.getItem(STORE)||'null')}catch{return null}}
function writeStore(data){localStorage.setItem(STORE,JSON.stringify(data));window.dispatchEvent(new Event('mayfit-store-updated'))}
function readCustom(){try{return JSON.parse(localStorage.getItem(CUSTOM_KEY)||'{}')||{}}catch{return{}}}
function writeCustom(data){localStorage.setItem(CUSTOM_KEY,JSON.stringify(data))}

function renameExercise(item){
  const type=String(item?.dataset.type||'');
  const title=item?.querySelector('.mse-info strong');
  if(!type||!title)return;
  const current=clean(title.textContent)||'Exercício';
  const answer=window.prompt('Digite o novo nome do exercício:',current);
  if(answer===null)return;
  const name=clean(answer);
  if(!name){window.alert('Digite um nome para o exercício.');return}

  const custom=readCustom();
  custom[type]=name;
  writeCustom(custom);

  const store=readStore();
  if(store&&Array.isArray(store.exercises)){
    let changed=false;
    const exercises=store.exercises.map(exercise=>{
      if(String(exercise.type)!==type)return exercise;
      changed=true;
      return {...exercise,name};
    });
    if(changed)writeStore({...store,exercises});
  }
  title.textContent=name;
}

function syncCustomName(type){
  const name=clean(readCustom()[type]);
  if(!name)return;
  const store=readStore();
  if(!store||!Array.isArray(store.exercises))return;
  let changed=false;
  const exercises=store.exercises.map(exercise=>{
    if(String(exercise.type)!==String(type)||exercise.name===name)return exercise;
    changed=true;
    return {...exercise,name};
  });
  if(changed)writeStore({...store,exercises});
}

function ensureStyle(){
  if(document.getElementById('mayfit-exercise-rename-style'))return;
  const style=document.createElement('style');
  style.id='mayfit-exercise-rename-style';
  style.textContent=`
    #mse-modal .mse-rename-any{min-width:92px;padding:10px 12px;border:1px solid #66836e;border-radius:11px;background:#142219;color:#9bea62;font-weight:950;cursor:pointer}
    @media(max-width:620px){#mse-modal .mse-rename-any{grid-column:1/-1;width:100%;min-width:0;padding:11px;font-size:14px}}
  `;
  document.head.appendChild(style);
}

function apply(){
  ensureStyle();
  const custom=readCustom();
  document.querySelectorAll('#mse-modal .mse-item').forEach(item=>{
    const type=String(item.dataset.type||'');
    const info=item.querySelector('.mse-info');
    const title=info?.querySelector('strong');
    if(!type||!info||!title)return;
    const saved=clean(custom[type]);
    if(saved&&title.textContent!==saved)title.textContent=saved;
    if(item.querySelector('.mse-rename,.mse-rename-any'))return;
    const button=document.createElement('button');
    button.type='button';
    button.className='mse-rename-any';
    button.textContent='Renomear';
    button.setAttribute('aria-label',`Renomear ${clean(title.textContent)||'exercício'}`);
    const action=item.querySelector('.mse-action');
    item.insertBefore(button,action||null);
  });
}

document.addEventListener('click',event=>{
  const rename=event.target.closest?.('#mse-modal .mse-rename-any');
  if(rename){
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
    renameExercise(rename.closest('.mse-item'));
    return;
  }
  const add=event.target.closest?.('#mse-modal .mse-action[data-action="add"]');
  if(add){
    const type=add.closest('.mse-item')?.dataset.type;
    if(type)setTimeout(()=>syncCustomName(type),80);
  }
},true);

const observer=new MutationObserver(()=>requestAnimationFrame(apply));
observer.observe(document.documentElement,{childList:true,subtree:true});
window.addEventListener('mayfit-store-updated',apply);
window.addEventListener('pageshow',apply);
apply();
