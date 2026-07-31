import { supabase } from './lib/supabase.js';

const STORE='mayfit_v8';
const DB='https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/dist/exercises.json';
let catalog=[];
let overlay=null;
let selected=new Set();

function currentUser(){
  try{return JSON.parse(sessionStorage.getItem('mayfit_user')||'{}')}catch{return{}}
}
function isStudent(){return currentUser()?.role==='student'}
function readData(){
  try{return JSON.parse(localStorage.getItem(STORE)||'{}')}catch{return{}}
}
function writeData(data){localStorage.setItem(STORE,JSON.stringify(data))}
function esc(value){return String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}

async function loadCatalog(){
  if(catalog.length)return catalog;
  try{
    const response=await fetch(DB);
    const list=response.ok?await response.json():[];
    catalog=Array.isArray(list)?list.map(item=>({id:item.id,name:item.name})).filter(item=>item.id&&item.name).sort((a,b)=>a.name.localeCompare(b.name,'pt-BR')):[];
  }catch{catalog=[]}
  return catalog;
}

async function saveCloud(data){
  const user=currentUser();
  if(!supabase||!user?.id)return;
  const exercises=Array.isArray(data.exercises)?data.exercises:[];
  const {error}=await supabase.from('workout_plans').upsert({
    user_id:user.id,
    plan_data:{exercises},
    updated_at:new Date().toISOString()
  },{onConflict:'user_id'});
  if(error)throw error;
}

function style(){
  if(document.getElementById('student-workout-manager-style'))return;
  const el=document.createElement('style');
  el.id='student-workout-manager-style';
  el.textContent=`
  .student-manage-button{width:100%;margin:14px 0;padding:14px;border:1px solid #5c8c68;border-radius:16px;background:#16311f;color:#9df20f;font:900 15px system-ui}
  .student-manager{position:fixed;inset:0;z-index:100000;background:#030806;color:#fff;overflow:auto;padding:max(16px,env(safe-area-inset-top)) 14px max(30px,env(safe-area-inset-bottom));font-family:system-ui,-apple-system,sans-serif}
  .student-manager-head{display:flex;align-items:center;justify-content:space-between;gap:12px;position:sticky;top:0;background:#030806;padding:4px 0 14px;z-index:3}.student-manager-head h1{margin:0;font-size:23px}.student-manager-head button{width:44px;height:44px;border:1px solid #3b5e45;border-radius:14px;background:#0d1811;color:#fff;font-size:25px}
  .student-manager-tools{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:14px}.student-manager-tools button{padding:11px 13px;border:1px solid #41634b;border-radius:12px;background:#101b14;color:#fff;font-weight:850}.student-manager-tools .danger{background:#301413;color:#ff9991}
  .student-exercise-card{border:1px solid #31503a;border-radius:18px;background:#0b1710;margin-bottom:12px;padding:13px}.student-exercise-top{display:flex;gap:10px;align-items:center}.student-exercise-top input[type=checkbox]{width:22px;height:22px;accent-color:#8df20b}.student-exercise-top strong{flex:1;font-size:17px}.student-exercise-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:9px;margin-top:12px}.student-exercise-grid label{font-size:11px;color:#aab6ae;font-weight:800}.student-exercise-grid input,.student-exercise-grid textarea{display:block;width:100%;box-sizing:border-box;margin-top:4px;padding:10px;border:1px solid #42634c;border-radius:10px;background:#050a07;color:#fff;font-size:16px}.student-exercise-grid .full{grid-column:1/-1}.student-exercise-grid textarea{min-height:70px;resize:vertical}
  .student-add-box{border:1px solid #31503a;border-radius:18px;background:#0b1710;padding:13px;margin-bottom:14px}.student-add-box input{width:100%;box-sizing:border-box;padding:12px;border:1px solid #42634c;border-radius:11px;background:#050a07;color:#fff}.student-catalog{max-height:330px;overflow:auto;margin-top:10px}.student-catalog label{display:flex;gap:9px;align-items:center;padding:10px 3px;border-bottom:1px solid #203529}.student-catalog input{width:20px;height:20px;accent-color:#8df20b}.student-manager-save{position:sticky;bottom:8px;width:100%;padding:15px;border:0;border-radius:15px;background:#79df25;color:#071008;font-weight:950;font-size:16px;box-shadow:0 8px 28px #000}
  `;
  document.head.appendChild(el)
}

function normalizeExercise(item,index){
  return {
    id:item.id??Date.now()+index,
    type:item.type||item.id||'supino',
    name:item.name||'Exercício',
    sets:Number(item.sets)||3,
    reps:Number(item.reps)||12,
    load:Number(item.load)||0,
    previousLoad:Number(item.previousLoad)||0,
    rest:Number(item.rest)||60,
    tip:item.tip||'Descreva a execução correta.'
  }
}

async function openManager(){
  if(!isStudent())return;
  style();
  await loadCatalog();
  selected=new Set();
  overlay?.remove();
  const data=readData();
  data.exercises=Array.isArray(data.exercises)?data.exercises.map(normalizeExercise):[];
  overlay=document.createElement('section');
  overlay.className='student-manager';
  overlay.innerHTML=`
    <div class="student-manager-head"><h1>Gerenciar meu treino</h1><button type="button" data-close>×</button></div>
    <div class="student-add-box">
      <input type="search" placeholder="Buscar exercício para adicionar" data-search>
      <div class="student-catalog" data-catalog></div>
      <button type="button" class="student-manage-button" data-add>Adicionar selecionados</button>
    </div>
    <div class="student-manager-tools">
      <button type="button" data-select-all>Selecionar todos do treino</button>
      <button type="button" data-clear>Limpar seleção</button>
      <button type="button" class="danger" data-delete>Excluir selecionados</button>
    </div>
    <div data-list></div>
    <button type="button" class="student-manager-save" data-save>Salvar meu treino</button>`;
  document.body.appendChild(overlay);

  const renderCatalog=()=>{
    const q=overlay.querySelector('[data-search]').value.trim().toLowerCase();
    const used=new Set(data.exercises.map(item=>item.type));
    const items=catalog.filter(item=>!used.has(item.id)&&(!q||item.name.toLowerCase().includes(q))).slice(0,100);
    overlay.querySelector('[data-catalog]').innerHTML=items.map(item=>`<label><input type="checkbox" data-add-id="${esc(item.id)}"><span>${esc(item.name)}</span></label>`).join('')||'<p style="color:#95a198">Nenhum exercício disponível.</p>';
  };
  const renderList=()=>{
    overlay.querySelector('[data-list]').innerHTML=data.exercises.map((item,index)=>`<article class="student-exercise-card" data-index="${index}"><div class="student-exercise-top"><input type="checkbox" data-select-id="${esc(item.id)}" ${selected.has(String(item.id))?'checked':''}><strong>${esc(item.name)}</strong></div><div class="student-exercise-grid"><label>Nome<input data-field="name" value="${esc(item.name)}"></label><label>Carga atual<input type="number" data-field="load" value="${item.load}"></label><label>Carga anterior<input type="number" data-field="previousLoad" value="${item.previousLoad}"></label><label>Séries<input type="number" min="1" data-field="sets" value="${item.sets}"></label><label>Repetições<input type="number" min="1" data-field="reps" value="${item.reps}"></label><label>Tempo (s)<input type="number" min="0" data-field="rest" value="${item.rest}"></label><label class="full">Orientação<textarea data-field="tip">${esc(item.tip)}</textarea></label></div></article>`).join('')||'<p style="padding:25px;text-align:center;color:#95a198">Nenhum exercício atribuído.</p>';
    renderCatalog();
  };
  const collect=()=>{
    overlay.querySelectorAll('.student-exercise-card').forEach(card=>{
      const index=Number(card.dataset.index);const item=data.exercises[index];if(!item)return;
      card.querySelectorAll('[data-field]').forEach(input=>{const field=input.dataset.field;item[field]=['sets','reps','load','previousLoad','rest'].includes(field)?Number(input.value)||0:input.value.trim()});
    });
  };

  overlay.querySelector('[data-close]').onclick=()=>overlay.remove();
  overlay.querySelector('[data-search]').oninput=renderCatalog;
  overlay.querySelector('[data-add]').onclick=()=>{
    collect();
    const ids=[...overlay.querySelectorAll('[data-add-id]:checked')].map(input=>input.dataset.addId);
    if(!ids.length)return alert('Selecione pelo menos um exercício.');
    let next=Math.max(0,...data.exercises.map(item=>Number(item.id)||0));
    const chosen=catalog.filter(item=>ids.includes(item.id));
    data.exercises.push(...chosen.map(item=>normalizeExercise({id:++next,type:item.id,name:item.name},0)));
    renderList();
  };
  overlay.querySelector('[data-list]').addEventListener('change',event=>{
    const input=event.target.closest('[data-select-id]');if(!input)return;
    input.checked?selected.add(String(input.dataset.selectId)):selected.delete(String(input.dataset.selectId));
  });
  overlay.querySelector('[data-select-all]').onclick=()=>{collect();selected=new Set(data.exercises.map(item=>String(item.id)));renderList()};
  overlay.querySelector('[data-clear]').onclick=()=>{selected.clear();renderList()};
  overlay.querySelector('[data-delete]').onclick=()=>{
    collect();if(!selected.size)return alert('Selecione os exercícios que deseja excluir.');
    if(!confirm(`Excluir ${selected.size} exercício(s) do seu treino?`))return;
    data.exercises=data.exercises.filter(item=>!selected.has(String(item.id)));selected.clear();renderList();
  };
  overlay.querySelector('[data-save]').onclick=async()=>{
    collect();
    const button=overlay.querySelector('[data-save]');button.disabled=true;button.textContent='Salvando...';
    try{
      writeData(data);
      await saveCloud(data);
      alert('Seu treino foi salvo com sucesso.');
      overlay.remove();location.reload();
    }catch(error){
      button.disabled=false;button.textContent='Salvar meu treino';
      alert('Não foi possível salvar no servidor: '+error.message);
    }
  };
  renderList();
}

function installButton(){
  if(!isStudent())return;
  const title=[...document.querySelectorAll('.section-title h1')].find(item=>/meu treino/i.test(item.textContent||''));
  const section=title?.closest('main');
  if(!title||!section||section.querySelector('.student-manage-button[data-open-manager]'))return;
  const button=document.createElement('button');button.type='button';button.className='student-manage-button';button.dataset.openManager='true';button.textContent='Gerenciar meu treino';button.onclick=openManager;
  title.closest('.section-title').insertAdjacentElement('afterend',button);
}

style();
const observer=new MutationObserver(installButton);
observer.observe(document.documentElement,{childList:true,subtree:true});
installButton();
