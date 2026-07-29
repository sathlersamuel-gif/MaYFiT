import { createClient } from '@supabase/supabase-js';
import { supabase } from './lib/supabase.js';

const URL='https://hcijxrakfrvcksuanrdy.supabase.co';
const KEY='sb_publishable_A7SHtwE7jpKGcP6yaPmcGw_mTJeodrN';
const secondary=createClient(URL,KEY,{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}});
const USER_KEY='mayfit_user';
let mounted=false;

const css=`
#mayfit-students{margin:0 0 18px;padding:16px;border:1px solid #2d5038;border-radius:22px;background:#0d1711;color:#fff}
#mayfit-students .ms-head{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:12px}
#mayfit-students h2{margin:0;font-size:22px}
#mayfit-students .ms-actions{display:flex;gap:8px;flex-wrap:wrap}
#mayfit-students button{border:0;border-radius:12px;padding:10px 12px;font-weight:850}
#mayfit-students .ms-primary{background:#78d532;color:#07110c}
#mayfit-students .ms-secondary{background:#1a2e20;color:#8fe52f;border:1px solid #355640}
#mayfit-students .ms-danger{background:#3a1b1b;color:#ffb6b6}
#mayfit-students .ms-search{width:100%;margin-bottom:12px;background:#08110b;border:1px solid #304939;color:#fff;border-radius:12px;padding:11px}
#mayfit-students .ms-list{display:grid;gap:10px}
#mayfit-students .ms-card{padding:12px;border:1px solid #294133;border-radius:16px;background:#101a14}
#mayfit-students .ms-row{display:flex;align-items:flex-start;justify-content:space-between;gap:12px}
#mayfit-students .ms-name{font-weight:900;font-size:16px}
#mayfit-students .ms-email{font-size:12px;color:#98a69d;margin-top:3px;word-break:break-word}
#mayfit-students .ms-badge{font-size:11px;font-weight:900;padding:5px 8px;border-radius:999px;background:#233528;color:#b8c8bd;white-space:nowrap}
#mayfit-students .ms-badge.active{background:#173b20;color:#91ea50}
#mayfit-students .ms-badge.blocked{background:#3a2020;color:#ffadad}
#mayfit-students .ms-card-actions{display:flex;gap:7px;flex-wrap:wrap;margin-top:10px}
#mayfit-students .ms-empty{padding:18px;text-align:center;color:#98a69d}
#mayfit-students .ms-msg{margin:8px 0;color:#a9b8af;font-size:13px}
@media(max-width:620px){#mayfit-students{margin-top:4px;padding:13px;border-radius:18px}#mayfit-students .ms-head{align-items:flex-start;flex-direction:column}#mayfit-students .ms-actions{width:100%}#mayfit-students .ms-actions button{flex:1}#mayfit-students .ms-row{gap:8px}}
`;

function current(){try{return JSON.parse(sessionStorage.getItem(USER_KEY))}catch{return null}}
function esc(v){return String(v??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]))}
function statusLabel(s){return s==='active'?'Ativo':s==='blocked'?'Bloqueado':'Pendente'}

async function loadStudents(root){
  const list=root.querySelector('.ms-list');
  const msg=root.querySelector('.ms-msg');
  msg.textContent='Carregando alunos...';
  const {data,error}=await supabase.from('profiles').select('id,full_name,email,role,status,created_at').eq('role','student').order('created_at',{ascending:false});
  if(error){msg.textContent='Não foi possível carregar: '+error.message;return}
  root._students=data||[];
  msg.textContent=`${root._students.length} aluno(s) encontrado(s)`;
  render(root);
}

function render(root){
  const q=(root.querySelector('.ms-search').value||'').trim().toLowerCase();
  const data=(root._students||[]).filter(x=>!q||`${x.full_name||''} ${x.email||''}`.toLowerCase().includes(q));
  const list=root.querySelector('.ms-list');
  if(!data.length){list.innerHTML='<div class="ms-empty">Nenhum aluno encontrado.</div>';return}
  list.innerHTML=data.map(x=>`<article class="ms-card" data-id="${esc(x.id)}"><div class="ms-row"><div><div class="ms-name">${esc(x.full_name||'Aluno sem nome')}</div><div class="ms-email">${esc(x.email||'E-mail não informado')}</div></div><span class="ms-badge ${esc(x.status)}">${statusLabel(x.status)}</span></div><div class="ms-card-actions"><button class="ms-secondary" data-action="edit">Editar</button><button class="ms-secondary" data-action="toggle">${x.status==='blocked'?'Desbloquear':'Bloquear'}</button><button class="ms-danger" data-action="delete">Excluir</button></div></article>`).join('');
}

async function createStudent(root){
  const name=prompt('Nome completo do aluno:'); if(!name?.trim())return;
  const email=prompt('E-mail do aluno:'); if(!email?.trim())return;
  const password=prompt('Senha inicial com pelo menos 6 caracteres:');
  if(!password||password.length<6){alert('A senha precisa ter pelo menos 6 caracteres.');return}
  const {data,error}=await secondary.auth.signUp({email:email.trim(),password,options:{data:{full_name:name.trim()}}});
  if(error){alert('Não foi possível cadastrar: '+error.message);return}
  if(data.user){
    await supabase.from('profiles').update({full_name:name.trim(),role:'student',status:'active'}).eq('id',data.user.id);
  }
  alert('Aluno cadastrado com sucesso.');
  loadStudents(root);
}

async function handleCard(root,button){
  const card=button.closest('.ms-card'); const id=card?.dataset.id;
  const student=(root._students||[]).find(x=>x.id===id); if(!student)return;
  const action=button.dataset.action;
  if(action==='edit'){
    const name=prompt('Nome completo:',student.full_name||''); if(!name?.trim())return;
    const {error}=await supabase.from('profiles').update({full_name:name.trim()}).eq('id',id);
    if(error)return alert(error.message);
  }
  if(action==='toggle'){
    const next=student.status==='blocked'?'active':'blocked';
    const {error}=await supabase.from('profiles').update({status:next}).eq('id',id);
    if(error)return alert(error.message);
  }
  if(action==='delete'){
    if(!confirm(`Excluir o aluno ${student.full_name||''}?`))return;
    const {error}=await supabase.from('profiles').delete().eq('id',id);
    if(error)return alert('Não foi possível excluir: '+error.message);
  }
  loadStudents(root);
}

function mount(){
  if(mounted||current()?.role!=='admin'||!supabase)return;
  const main=document.querySelector('.app main');
  if(!main)return;
  mounted=true;
  if(!document.getElementById('mayfit-students-style')){const style=document.createElement('style');style.id='mayfit-students-style';style.textContent=css;document.head.appendChild(style)}
  const root=document.createElement('section');
  root.id='mayfit-students';
  root.innerHTML='<div class="ms-head"><div><h2>Alunos cadastrados</h2><div class="ms-msg">Conectando ao banco...</div></div><div class="ms-actions"><button class="ms-primary" data-new>Novo aluno</button><button class="ms-secondary" data-refresh>Atualizar</button></div></div><input class="ms-search" placeholder="Pesquisar por nome ou e-mail"><div class="ms-list"></div>';
  main.prepend(root);
  root.querySelector('[data-new]').onclick=()=>createStudent(root);
  root.querySelector('[data-refresh]').onclick=()=>loadStudents(root);
  root.querySelector('.ms-search').oninput=()=>render(root);
  root.addEventListener('click',e=>{const b=e.target.closest('[data-action]');if(b)handleCard(root,b)});
  loadStudents(root);
}

const observer=new MutationObserver(()=>mount());
observer.observe(document.documentElement,{childList:true,subtree:true});
mount();
