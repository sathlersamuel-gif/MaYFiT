const STORE='mayfit_v8';
const CATALOG_KEY='mayfit_exercise_catalog_v1';
const DB='https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/dist/exercises.json';
const IMAGE_BASE='https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/';
const PAGE_SIZE=70;
const EAGER_IMAGES=18;
let catalog=[];
let fetching=false;

function currentUser(){try{return JSON.parse(sessionStorage.getItem('mayfit_user')||'null')}catch{return null}}
function readStore(){try{return JSON.parse(localStorage.getItem(STORE)||'null')}catch{return null}}
function writeStore(data){localStorage.setItem(STORE,JSON.stringify(data));window.dispatchEvent(new Event('mayfit-store-updated'))}
function esc(value){return String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]))}
function imageUrl(item){return item?.image?IMAGE_BASE+item.image:''}

function cachedCatalog(){
  if(catalog.length)return catalog;
  try{
    const parsed=JSON.parse(localStorage.getItem(CATALOG_KEY)||'[]');
    if(Array.isArray(parsed)&&parsed.length)catalog=parsed;
  }catch{}
  return catalog;
}

function prewarmVisibleImages(items){
  items.slice(0,EAGER_IMAGES).forEach(item=>{
    const src=imageUrl(item);if(!src)return;
    const image=new Image();image.decoding='async';image.fetchPriority='high';image.src=src;
  });
}

async function refreshCatalog(modal){
  if(fetching||catalog.length)return;
  fetching=true;
  try{
    const response=await fetch(DB,{cache:'force-cache'});
    if(!response.ok)return;
    const data=await response.json();
    catalog=(Array.isArray(data)?data:[]).map(item=>({id:item.id,name:item.name,image:Array.isArray(item.images)?item.images[0]:''})).filter(item=>item.id&&item.name).sort((a,b)=>a.name.localeCompare(b.name,'pt-BR'));
    try{localStorage.setItem(CATALOG_KEY,JSON.stringify(catalog))}catch{}
    prewarmVisibleImages(catalog);
    if(modal?.isConnected)render(modal,true);
  }catch{}finally{fetching=false}
}

function addExercise(type){
  const store=readStore();
  if(!store||!Array.isArray(store.exercises))return false;
  if(store.exercises.some(item=>item.type===type))return true;
  const item=catalog.find(exercise=>exercise.id===type);
  if(!item)return false;
  const nextId=Math.max(0,...store.exercises.map(exercise=>Number(exercise.id)||0))+1;
  writeStore({...store,exercises:[...store.exercises,{id:nextId,type:item.id,name:item.name,sets:3,reps:12,load:0,previousLoad:0,rest:60,tip:'Execute o movimento com controle e postura correta.'}]});
  return true;
}

function removeExercise(type,id){
  const store=readStore();
  if(!store||!Array.isArray(store.exercises))return false;
  const exercise=store.exercises.find(item=>String(item.id)===String(id)||item.type===type);
  if(!exercise)return true;
  if(!confirm(`Remover ${exercise.name||'este exercício'} do seu treino?`))return false;
  writeStore({...store,exercises:store.exercises.filter(item=>String(item.id)!==String(exercise.id))});
  return true;
}

function openImagePreview(src,alt){
  document.getElementById('mse-image-preview')?.remove();
  const preview=document.createElement('div');
  preview.id='mse-image-preview';
  preview.setAttribute('role','dialog');
  preview.setAttribute('aria-label',alt||'Imagem ampliada do exercício');
  preview.style.cssText='position:fixed;inset:0;z-index:200000;display:grid;place-items:center;padding:20px;background:rgba(0,0,0,.94);';
  preview.innerHTML=`<button type="button" aria-label="Fechar imagem" style="position:absolute;top:max(18px,env(safe-area-inset-top));right:18px;width:46px;height:46px;border:0;border-radius:14px;background:#17231b;color:#fff;font-size:28px;font-weight:900">×</button><img src="${esc(src)}" alt="${esc(alt||'Exercício')}" style="display:block;max-width:min(92vw,760px);max-height:84vh;width:auto;height:auto;object-fit:contain;border-radius:16px;background:#050806">`;
  const close=()=>preview.remove();
  preview.querySelector('button').onclick=close;
  preview.addEventListener('click',event=>{if(event.target===preview)close()});
  document.body.appendChild(preview);
}

function render(modal,reset=false){
  if(!modal?.isConnected)return;
  const search=modal.querySelector('.mse-search');
  const list=modal.querySelector('.mse-list');
  const footer=modal.querySelector('.mse-footer');
  if(reset)modal.dataset.limit=String(PAGE_SIZE);
  const query=(search?.value||'').trim().toLowerCase();
  const store=readStore();
  const exercises=Array.isArray(store?.exercises)?store.exercises:[];
  const used=new Map(exercises.map(item=>[item.type,item]));
  const source=cachedCatalog();
  const filtered=source.filter(item=>!query||String(item.name||'').toLowerCase().includes(query));
  const limit=Math.max(PAGE_SIZE,Number(modal.dataset.limit)||PAGE_SIZE);
  const visible=filtered.slice(0,limit);
  prewarmVisibleImages(visible);
  list.innerHTML=visible.map((item,index)=>{
    const existing=used.get(item.id);
    const src=imageUrl(item);
    const thumb=src?`<img class="mse-thumb" src="${esc(src)}" alt="${esc(item.name)}" loading="${index<EAGER_IMAGES?'eager':'lazy'}" decoding="async" fetchpriority="${index<EAGER_IMAGES?'high':'auto'}" data-expand-image="true" style="cursor:zoom-in" onerror="this.style.visibility='hidden'">`:'<span class="mse-thumb" aria-hidden="true"></span>';
    return `<article class="mse-item" data-type="${esc(item.id)}">${thumb}<span class="mse-info"><strong>${esc(item.name)}</strong><small>${existing?'Já está no seu treino':'Disponível para adicionar'}</small></span><button type="button" class="mse-action ${existing?'remove':''}" data-action="${existing?'remove':'add'}" data-id="${existing?.id??''}">${existing?'Remover':'Adicionar'}</button></article>`;
  }).join('')||'<div style="padding:20px;text-align:center;color:#96a49a">Carregando exercícios...</div>';
  if(visible.length<filtered.length){
    const more=document.createElement('button');
    more.type='button';more.className='mse-action';more.textContent=`Mostrar mais (${filtered.length-visible.length})`;
    more.style.cssText='width:100%;margin-top:4px';
    more.onclick=()=>{modal.dataset.limit=String(limit+PAGE_SIZE);render(modal)};
    list.appendChild(more);
  }
  footer.textContent=`${exercises.length} exercício(s) no treino • ${filtered.length} encontrado(s)`;
}

function openFastManager(){
  document.getElementById('mse-modal')?.remove();
  cachedCatalog();
  prewarmVisibleImages(catalog);
  const modal=document.createElement('div');
  modal.id='mse-modal';modal.dataset.fastManager='1';modal.dataset.limit=String(PAGE_SIZE);
  modal.innerHTML='<div class="mse-card"><div class="mse-top"><div><h2>Adicionar ou remover exercícios</h2><div style="color:#9cac9f;font-size:13px;margin-top:4px">Lista otimizada para abrir rapidamente.</div></div><button class="mse-back" type="button">← Voltar</button></div><input class="mse-search" placeholder="Pesquisar exercício"><div class="mse-list"></div><div class="mse-footer"></div></div>';
  document.body.appendChild(modal);
  const close=()=>modal.remove();
  modal.querySelector('.mse-back').onclick=close;
  modal.addEventListener('click',event=>{if(event.target===modal)close()});
  let searchTimer;
  modal.querySelector('.mse-search').addEventListener('input',()=>{clearTimeout(searchTimer);searchTimer=setTimeout(()=>render(modal,true),80)});
  modal.querySelector('.mse-list').addEventListener('click',event=>{
    const image=event.target.closest('img[data-expand-image="true"]');
    if(image){
      event.preventDefault();
      event.stopPropagation();
      openImagePreview(image.currentSrc||image.src,image.alt);
      return;
    }
    const button=event.target.closest('.mse-action[data-action]');if(!button)return;
    const item=button.closest('.mse-item');const type=item?.dataset.type;if(!type)return;
    button.disabled=true;
    const changed=button.dataset.action==='add'?addExercise(type):removeExercise(type,button.dataset.id);
    if(changed)render(modal);
    else button.disabled=false;
  });
  render(modal,true);
  refreshCatalog(modal);
}

document.addEventListener('click',event=>{
  if(currentUser()?.role!=='student')return;
  const button=event.target.closest('#mayfit-student-exercises button');
  if(!button)return;
  event.preventDefault();
  event.stopPropagation();
  event.stopImmediatePropagation();
  openFastManager();
},true);

cachedCatalog();
prewarmVisibleImages(catalog);
