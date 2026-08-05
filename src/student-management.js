import { createClient } from '@supabase/supabase-js';
import { supabase } from './lib/supabase.js';

const URL='https://hcijxrakfrvcksuanrdy.supabase.co';
const KEY='sb_publishable_A7SHtwE7jpKGcP6yaPmcGw_mTJeodrN';
let secondary=null;
const USER_KEY='mayfit_user';
let mounted=false;
let loading=false;
let observer;

const css=`
#mayfit-students{margin:0 0 18px;padding:16px;border:1px solid #2d5038;border-radius:22px;background:#0d1711;color:#fff;content-visibility:auto;contain-intrinsic-size:420px}
#mayfit-students .ms-head{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:12px}
#mayfit-students h2{margin:0;font-size:22px}
#mayfit-students .ms-actions{display:flex;gap:8px;flex-wrap:wrap}
#mayfit-students button{border:0;border-radius:12px;padding:10px 12px;font-weight:850;cursor:pointer}
#mayfit-students button:disabled{opacity:.55;cursor:default}
#mayfit-students .ms-primary{background:#78d532;color:#07110c}
#mayfit-students .ms-approve{background:#78d532;color:#07110c}
#mayfit-students .ms-secondary{background:#1a2e20;color:#8fe52f;border:1px solid #355640}
#mayfit-students .ms-danger{background:#3a1b1b;color:#ffb6b6}
#mayfit-students .ms-search{width:100%;margin-bottom:12px;background:#08110b;border:1px solid #304939;color:#fff;border-radius:12px;padding:11px;box-sizing:border-box}
#mayfit-students .ms-list{display:grid;gap:10px}
#mayfit-students .ms-card{padding:12px;border:1px solid #294133;border-radius:16px;background:#101a14}
#mayfit-students .ms-card.pending{border-color:#9b7625;background:#1c180d}
#mayfit-students .ms-row{display:flex;align-items:flex-start;justify-content:space-between;gap:12px}
#mayfit-students .ms-name{font-weight:900;font-size:16px}
#mayfit-students .ms-badge{font-size:11px;font-weight:900;padding:5px 8px;border-radius:999px;background:#233528;color:#b8c8bd;white-space:nowrap}
#mayfit-students .ms-badge.active{background:#173b20;color:#91ea50}
#mayfit-students .ms-badge.blocked{background:#3a2020;color:#ffadad}
#mayfit-students .ms-badge.pending{background:#4a3812;color:#ffd76a}
#mayfit-students .ms-card-actions{display:flex;gap:7px;flex-wrap:wrap;margin-top:10px}
#mayfit-students .ms-empty{padding:18px;text-align:center;color:#98a69d}
#mayfit-students .ms-msg{margin:8px 0;color:#a9b8af;font-size:13px}
#mayfit-students .ms-pending-count{display:inline-grid;place-items:center;min-width:20px;height:20px;margin-left:6px;padding:0 5px;border-radius:999px;background:#ffd35a;color:#241b00;font-size:11px;font-weight:950}
@media(max-width:620px){#mayfit-students{margin-top:4px;padding:13px;border-radius:18px}#mayfit-students .ms-head{align-items:flex-start;flex-direction:column}#mayfit-students .ms-actions{width:100%}#mayfit-students .ms-actions button{flex:1}#mayfit-students .ms-row{gap:8px}}
`;

function current(){try{return JSON.parse(sessionStorage.getItem(USER_KEY))}catch{return null}}
function esc(v){return String(v??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]))}
function normalizedStatus(value){return value==='active'||value==='blocked'?value:'pending'}
function statusLabel(value){const s=normalizedStatus(value);return s==='active'?'Ativo':s==='blocked'?'Bloqueado':'Pendente'}
function secondaryClient(){
  if(!secondary)secondary=createClient(URL,KEY,{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false,storageKey:'mayfit-admin-secondary-auth'}});
  return secondary;
}

async function loadStudents(root){
  if(loading)return;
  loading=true;
  const refresh=root.querySelector('[data-refresh]');
  const msg=root.querySelector('.ms-msg');
  refresh.disabled=true;
  msg.textContent='Carregando alunos...';
  try{
    const {data,error}=await supabase.from('profiles').select('id,full_name,role,status,created_at').order('created_at',{ascending:false});
    if(error)throw error;
    root._students=(data||[]).filter(profile=>profile.role!=='admin');
    const pending=root._students.filter(profile=>normalizedStatus(profile.status)==='pending').length;
    msg.innerHTML=`${root._students.length} aluno(s) encontrado(s)${pending?` <span class="ms-pending-count">${pending}</span> aguardando aprovação`:''}`;
    render(root);
  }catch(error){
    msg.textContent='Não foi possível carregar os alunos: '+error.message;
    root.querySelector('.ms-list').innerHTML='<div class="ms-empty">Falha ao consultar o banco de dados.</div>';
  }finally{
    loading=false;
    refresh.disabled=false;
  }
}

function render(root){
  const q=(root.querySelector('.ms-search').value||'').trim().toLowerCase();
  const data=(root._students||[]).filter(x=>!q||`${x.full_name||''} ${x.id||''}`.toLowerCase().includes(q));
  const list=root.querySelector('.ms-list');
  if(!data.length){list.innerHTML='<div class="ms-empty">Nenhum aluno encontrado.</div>';return}
  list.innerHTML=data.map(x=>{
    const status=normalizedStatus(x.status);
    const approve=status==='pending'?'<button class="ms-approve" data-action="approve">Aprovar aluno</button>':'';
    const toggle=status==='pending'?'':`<button class="ms-secondary" data-action="toggle">${status==='blocked'?'Desbloquear':'Bloquear'}</button>`;
    return `<article class="ms-card ${status}" data-id="${esc(x.id)}"><div class="ms-row"><div><div class="ms-name">${esc(x.full_name||'Aluno sem nome')}</div></div><span class="ms-badge ${status}">${statusLabel(status)}</span></div><div class="ms-card-actions">${approve}<button class="ms-secondary" data-action="edit">Editar</button>${toggle}<button class="ms-danger" data-action="delete">Excluir</button></div></article>`;
  }).join('');
}

async function createStudent(root){
  const name=prompt('Nome completo do aluno:'); if(!name?.trim())return;
  const email=prompt('E-mail do aluno:'); if(!email?.trim())return;
  const password=prompt('Senha inicial com pelo menos 6 caracteres:');
  if(!password||password.length<6){alert('A senha precisa ter pelo menos 6 caracteres.');return}
  const {data,error}=await secondaryClient().auth.signUp({email:email.trim(),password,options:{data:{full_name:name.trim()}}});
  if(error){alert('Não foi possível cadastrar: '+error.message);return}
  if(data.user){
    const {error:updateError}=await supabase.from('profiles').update({full_name:name.trim(),role:'student',status:'active'}).eq('id',data.user.id);
    if(updateError){alert('O login foi criado, mas o perfil não pôde ser ativado: '+updateError.message);return}
  }
  alert('Aluno cadastrado com sucesso.');
  await loadStudents(root);
}

async function deleteStudentAccount(id){
  const rpc=await supabase.rpc('delete_student_account',{target_user_id:id});
  if(!rpc.error)return;
  const missing=/function .*delete_student_account|could not find the function|schema cache/i.test(rpc.error.message||'');
  if(!missing)throw rpc.error;

  const direct=await supabase.from('profiles').delete().eq('id',id).select('id');
  if(direct.error)throw direct.error;
  if(!direct.data?.length)throw new Error('O banco recusou a exclusão. É necessário ativar a permissão segura de exclusão no Supabase.');
}

async function handleCard(root,button){
  const card=button.closest('.ms-card');
  const id=card?.dataset.id;
  const student=(root._students||[]).find(x=>x.id===id);
  if(!student)return;
  const action=button.dataset.action;
  button.disabled=true;
  try{
    if(action==='approve'){
      const {error}=await supabase.from('profiles').update({role:'student',status:'active'}).eq('id',id);
      if(error)throw error;
    }
    if(action==='edit'){
      const name=prompt('Nome completo:',student.full_name||''); if(!name?.trim())return;
      const {error}=await supabase.from('profiles').update({full_name:name.trim()}).eq('id',id);
      if(error)throw error;
    }
    if(action==='toggle'){
      const next=normalizedStatus(student.status)==='blocked'?'active':'blocked';
      const {error}=await supabase.from('profiles').update({status:next}).eq('id',id);
      if(error)throw error;
    }
    if(action==='delete'){
      if(!confirm(`Excluir definitivamente o aluno ${student.full_name||''}?`))return;
      button.textContent='Excluindo...';
      await deleteStudentAccount(id);
      root._students=(root._students||[]).filter(item=>item.id!==id);
      render(root);
      alert('Aluno excluído com sucesso.');
    }
    if(action!=='delete')await loadStudents(root);
  }catch(error){
    alert('Não foi possível concluir: '+error.message);
    await loadStudents(root);
  }finally{
    button.disabled=false;
    if(action==='delete')button.textContent='Excluir';
  }
}

function mount(){
  if(current()?.role!=='admin'||!supabase){
    document.getElementById('mayfit-students')?.remove();
    mounted=false;
    return false;
  }
  if(mounted&&document.getElementById('mayfit-students'))return true;
  const main=document.querySelector('.app main');
  if(!main)return false;
  mounted=true;
  if(!document.getElementById('mayfit-students-style')){
    const style=document.createElement('style');
    style.id='mayfit-students-style';
    style.textContent=css;
    document.head.appendChild(style);
  }
  const root=document.createElement('section');
  root.id='mayfit-students';
  root.innerHTML='<div class="ms-head"><div><h2>Alunos cadastrados</h2><div class="ms-msg">Conectando ao banco...</div></div><div class="ms-actions"><button class="ms-primary" data-new>Novo aluno</button><button class="ms-secondary" data-refresh>Atualizar</button></div></div><input class="ms-search" placeholder="Pesquisar por nome"><div class="ms-list"></div>';
  main.prepend(root);
  root.querySelector('[data-new]').onclick=()=>createStudent(root);
  root.querySelector('[data-refresh]').onclick=()=>loadStudents(root);
  root.querySelector('.ms-search').oninput=()=>render(root);
  root.addEventListener('click',event=>{const button=event.target.closest('[data-action]');if(button)handleCard(root,button)});
  loadStudents(root);
  return true;
}

observer=new MutationObserver(()=>requestAnimationFrame(mount));
observer.observe(document.documentElement,{childList:true,subtree:true});
window.addEventListener('pageshow',mount);
window.addEventListener('focus',mount);
mount();
