const STORE='mayfit_v8';
const DB='https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/dist/exercises.json';
const USER_KEY='mayfit_user';
let mounted=false;
let loading=false;
let allExercises=[];
let selected=new Set();

const css=`
#mayfit-student-exercises{margin:0 0 18px;padding:16px;border:1px solid #31523d;border-radius:22px;background:#0d1711;color:#fff}
#mayfit-student-exercises .mse-head{display:flex;align-items:center;justify-content:space-between;gap:12px}
#mayfit-student-exercises h2{margin:0;font-size:21px}
#mayfit-student-exercises p{margin:5px 0 0;color:#9cac9f;font-size:13px}
#mayfit-student-exercises button{border:0;border-radius:12px;padding:11px 14px;background:#78d532;color:#07110c;font-weight:900;cursor:pointer}
#mse-modal{position:fixed;inset:0;z-index:99999;display:grid;place-items:center;padding:14px;background:rgba(0,0,0,.82)}
#mse-modal .mse-card{width:min(720px,100%);max-height:90vh;display:flex;flex-direction:column;border:1px solid #3d6249;border-radius:22px;background:#0b130e;color:#fff;overflow:hidden}
#mse-modal .mse-top{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:15px;border-bottom:1px solid #263d2d}
#mse-modal h2{margin:0;font-size:21px}
#mse-modal .mse-close{width:38px;height:38px;padding:0;border:1px solid #385442;border-radius:12px;background:#17231b;color:#fff;font-size:22px}
#mse-modal .mse-search{margin:12px 15px;padding:12px;border:1px solid #3a5743;border-radius:12px;background:#07100a;color:#fff;font-size:16px}
#mse-modal .mse-list{display:grid;gap:8px;padding:0 15px 15px;overflow:auto}
#mse-modal .mse-item{display:flex;align-items:center;gap:10px;padding:11px;border:1px solid #263d2d;border-radius:13px;background:#101a14;cursor:pointer}
#mse-modal .mse-item input{width:20px;height:20px;accent-color:#78d532}
#mse-modal .mse-item span{font-weight:750}
#mse-modal .mse-item.used{opacity:.52;cursor:default}
#mse-modal .mse-footer{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:13px 15px;border-top:1px solid #263d2d;background:#0d1711}
#mse-modal .mse-count{color:#a9b8af;font-size:13px}
#mse-modal .mse-add{border:0;border-radius:12px;padding:12px 16px;background:#78d532;color:#07110c;font-weight:950}
#mse-modal .mse-add:disabled{opacity:.5}
@media(max-width:620px){#mayfit-student-exercises{padding:13px;border-radius:18px}#mayfit-student-exercises .mse-head{align-items:flex-start;flex-direction:column}#mayfit-student-exercises button{width:100%}#mse-modal{padding:0;align-items:end}#mse-modal .mse-card{max-height:94vh;border-radius:22px 22px 0 0}}
`;

function currentUser(){try{return JSON.parse(sessionStorage.getItem(USER_KEY))}catch{return null}}
function readStore(){try{return JSON.parse(localStorage.getItem(STORE)||'null')}catch{return null}}
function writeStore(data){localStorage.setItem(STORE,JSON.stringify(data))}
function esc(value){return String(value??'').replace(/[&<>'"]/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[char]))}

function renderList(modal){
  const query=(modal.querySelector('.mse-search').value||'').trim().toLowerCase();
  const store=readStore();
  const used=new Set((store?.exercises||[]).map(item=>item.type));
  const filtered=allExercises.filter(item=>!query||item.name.toLowerCase().includes(query));
  modal.querySelector('.mse-list').innerHTML=filtered.slice(0,350).map(item=>{
    const exists=used.has(item.id);
    return `<label class="mse-item ${exists?'used':''}"><input type="checkbox" value="${esc(item.id)}" ${exists?'disabled checked':selected.has(item.id)?'checked':''}><span>${esc(item.name)}</span></label>`;
  }).join('')||'<div style="padding:20px;text-align:center;color:#96a49a">Nenhum exercício encontrado.</div>';
  modal.querySelector('.mse-count').textContent=`${selected.size} selecionado(s)`;
  modal.querySelector('.mse-add').disabled=!selected.size;
}

async function loadCatalog(modal){
  if(allExercises.length){renderList(modal);return}
  if(loading)return;
  loading=true;
  modal.querySelector('.mse-list').innerHTML='<div style="padding:20px;text-align:center;color:#96a49a">Carregando exercícios...</div>';
  try{
    const response=await fetch(DB,{cache:'no-store'});
    if(!response.ok)throw new Error('Falha ao carregar catálogo');
    const data=await response.json();
    allExercises=(Array.isArray(data)?data:[]).map(item=>({id:item.id,name:item.name})).filter(item=>item.id&&item.name).sort((a,b)=>a.name.localeCompare(b.name,'pt-BR'));
    renderList(modal);
  }catch(error){
    modal.querySelector('.mse-list').innerHTML=`<div style="padding:20px;text-align:center;color:#ffb4b4">${esc(error.message)}. Tente novamente.</div>`;
  }finally{loading=false}
}

function addSelected(){
  const store=readStore();
  if(!store||!Array.isArray(store.exercises)){alert('Não foi possível acessar os treinos salvos.');return}
  const used=new Set(store.exercises.map(item=>item.type));
  let nextId=Math.max(0,...store.exercises.map(item=>Number(item.id)||0));
  const additions=allExercises.filter(item=>selected.has(item.id)&&!used.has(item.id)).map(item=>({
    id:++nextId,
    type:item.id,
    name:item.name,
    sets:3,
    reps:12,
    load:0,
    previousLoad:0,
    rest:60,
    tip:'Execute o movimento com controle e postura correta.'
  }));
  if(!additions.length){alert('Os exercícios selecionados já foram adicionados.');return}
  writeStore({...store,exercises:[...store.exercises,...additions]});
  alert(`${additions.length} exercício(s) adicionado(s) com sucesso.`);
  location.reload();
}

function openModal(){
  selected=new Set();
  const modal=document.createElement('div');
  modal.id='mse-modal';
  modal.innerHTML='<div class="mse-card"><div class="mse-top"><div><h2>Adicionar exercícios</h2><div style="color:#9cac9f;font-size:13px;margin-top:4px">Escolha no mesmo catálogo disponível ao administrador.</div></div><button class="mse-close" type="button">×</button></div><input class="mse-search" placeholder="Pesquisar exercício"><div class="mse-list"></div><div class="mse-footer"><span class="mse-count">0 selecionado(s)</span><button class="mse-add" type="button" disabled>Adicionar selecionados</button></div></div>';
  document.body.appendChild(modal);
  const close=()=>modal.remove();
  modal.querySelector('.mse-close').onclick=close;
  modal.addEventListener('click',event=>{if(event.target===modal)close()});
  modal.querySelector('.mse-search').oninput=()=>renderList(modal);
  modal.querySelector('.mse-list').addEventListener('change',event=>{
    const input=event.target.closest('input[type="checkbox"]');
    if(!input||input.disabled)return;
    input.checked?selected.add(input.value):selected.delete(input.value);
    renderList(modal);
  });
  modal.querySelector('.mse-add').onclick=addSelected;
  loadCatalog(modal);
}

function mount(){
  if(mounted||currentUser()?.role!=='student')return false;
  const main=document.querySelector('.app main');
  if(!main||document.querySelector('.workout-screen'))return false;
  if(!document.getElementById('mse-style')){
    const style=document.createElement('style');style.id='mse-style';style.textContent=css;document.head.appendChild(style);
  }
  const section=document.createElement('section');
  section.id='mayfit-student-exercises';
  section.innerHTML='<div class="mse-head"><div><h2>Meus exercícios</h2><p>Adicione novos exercícios ao seu treino.</p></div><button type="button">Adicionar exercícios</button></div>';
  section.querySelector('button').onclick=openModal;
  main.prepend(section);
  mounted=true;
  return true;
}

if(!mount()){
  const observer=new MutationObserver(()=>mount());
  observer.observe(document.documentElement,{childList:true,subtree:true});
  setTimeout(()=>observer.disconnect(),15000);
}
