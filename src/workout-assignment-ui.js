import { supabase } from './lib/supabase.js';

const USER_KEY='mayfit_user';
const STORE='mayfit_v8';
const TARGET_KEY='mayfit_admin_workout_target';
let mounted=false;
let busy=false;

function current(){try{return JSON.parse(sessionStorage.getItem(USER_KEY)||'null')}catch{return null}}
function readStore(){try{return JSON.parse(localStorage.getItem(STORE)||'null')}catch{return null}}
function esc(value){return String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]))}

const css=`
#mayfit-workout-assignment{margin:0 0 18px;padding:14px;border:1px solid #31543b;border-radius:18px;background:#0d1711;color:#fff;font-family:system-ui,-apple-system,sans-serif}
#mwa-title{margin:0 0 5px;font-size:19px;font-weight:950}.mwa-note{margin:0 0 12px;color:#9eada3;font-size:12px}
.mwa-row{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:9px;align-items:center}
#mwa-target{width:100%;min-width:0;height:44px;padding:0 11px;border:1px solid #45634e;border-radius:12px;background:#071009;color:#fff;font-weight:850;font-size:14px}
#mwa-save{height:44px;padding:0 15px;border:0;border-radius:12px;background:#8df20b;color:#071108;font-weight:950;white-space:nowrap}
#mwa-save:disabled,#mwa-target:disabled{opacity:.55}.mwa-status{min-height:17px;margin-top:9px;color:#a9b7ae;font-size:12px}
@media(max-width:620px){.mwa-row{grid-template-columns:1fr}.mwa-row #mwa-save{width:100%}}
`;

async function students(){
  const {data,error}=await supabase.from('profiles').select('id,full_name,role,status').order('full_name');
  if(error)throw error;
  return (data||[]).filter(item=>item.role!=='admin'&&item.status!=='blocked');
}

async function loadTarget(targetId,targetName,status){
  if(busy)return;busy=true;
  status.textContent=`Abrindo treino de ${targetName}...`;
  try{
    const user=current();
    if(targetId===user.id){
      sessionStorage.setItem(TARGET_KEY,JSON.stringify({id:user.id,name:'Meu treino'}));
      status.textContent='Meu treino selecionado.';
      return;
    }
    const {data,error}=await supabase.from('workout_plans').select('plan_data').eq('user_id',targetId).maybeSingle();
    if(error)throw error;
    const local=readStore();
    if(!local)throw new Error('Dados locais do treino não encontrados.');
    local.exercises=Array.isArray(data?.plan_data?.exercises)?data.plan_data.exercises:[];
    localStorage.setItem(STORE,JSON.stringify(local));
    sessionStorage.setItem(TARGET_KEY,JSON.stringify({id:targetId,name:targetName}));
    location.reload();
  }catch(error){status.textContent='Não foi possível abrir: '+error.message}
  finally{busy=false}
}

async function saveTarget(button,status){
  if(busy)return;
  const selected=JSON.parse(sessionStorage.getItem(TARGET_KEY)||'null');
  const user=current();
  const target=selected?.id?selected:{id:user.id,name:'Meu treino'};
  const local=readStore();
  const exercises=Array.isArray(local?.exercises)?local.exercises:[];
  if(!exercises.length){status.textContent='Adicione pelo menos um exercício antes de salvar.';return}
  busy=true;button.disabled=true;button.textContent='Salvando...';
  try{
    const payload={user_id:target.id,plan_data:{exercises},updated_at:new Date().toISOString()};
    const {error}=await supabase.from('workout_plans').upsert(payload,{onConflict:'user_id'});
    if(error)throw error;
    status.textContent=target.id===user.id?'Meu treino foi salvo.':`Treino atribuído para ${target.name}.`;
    button.textContent='Salvo ✓';
    setTimeout(()=>{button.textContent='Salvar / atribuir'},1400);
  }catch(error){status.textContent='Não foi possível salvar: '+error.message;button.textContent='Salvar / atribuir'}
  finally{busy=false;button.disabled=false}
}

async function mount(){
  const user=current();
  if(mounted||user?.role!=='admin'||!supabase)return false;
  const main=document.querySelector('.app main');
  const adminList=main?.querySelector('.admin-list');
  if(!main||!adminList)return false;
  mounted=true;
  if(!document.getElementById('mwa-style')){const style=document.createElement('style');style.id='mwa-style';style.textContent=css;document.head.appendChild(style)}
  const box=document.createElement('section');box.id='mayfit-workout-assignment';
  box.innerHTML='<h2 id="mwa-title">Atribuir treino</h2><p class="mwa-note">Escolha para quem você está montando a ficha. As fotos dos exercícios aparecem logo abaixo.</p><div class="mwa-row"><select id="mwa-target" disabled><option>Carregando alunos...</option></select><button id="mwa-save" type="button">Salvar / atribuir</button></div><div class="mwa-status"></div>';
  main.insertBefore(box,main.firstChild);
  const select=box.querySelector('#mwa-target');const save=box.querySelector('#mwa-save');const status=box.querySelector('.mwa-status');
  try{
    const list=await students();
    const selected=JSON.parse(sessionStorage.getItem(TARGET_KEY)||'null');
    const options=[{id:user.id,name:'Meu treino (Samuel)'},...list.map(item=>({id:item.id,name:item.full_name||'Aluno sem nome'}))];
    select.innerHTML=options.map(item=>`<option value="${esc(item.id)}">${esc(item.name)}</option>`).join('');
    const active=options.some(item=>item.id===selected?.id)?selected:{id:user.id,name:'Meu treino'};
    select.value=active.id;select.disabled=false;
    sessionStorage.setItem(TARGET_KEY,JSON.stringify(active));
    document.querySelector('.section-title h1')?.insertAdjacentHTML('afterend',`<small style="display:block;color:#8df20b;font-weight:850;margin-top:3px">Ficha: ${esc(active.name)}</small>`);
    select.onchange=()=>{const option=select.options[select.selectedIndex];loadTarget(select.value,option.textContent,status)};
    save.onclick=()=>saveTarget(save,status);
  }catch(error){select.innerHTML='<option>Falha ao carregar alunos</option>';status.textContent=error.message}
  return true;
}

const observer=new MutationObserver(()=>{if(mount())observer.disconnect()});
observer.observe(document.documentElement,{childList:true,subtree:true});
mount();
