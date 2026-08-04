import { createClient } from '@supabase/supabase-js';
import { supabase } from './lib/supabase.js';

const URL='https://hcijxrakfrvcksuanrdy.supabase.co';
const KEY='sb_publishable_A7SHtwE7jpKGcP6yaPmcGw_mTJeodrN';
const secondary=createClient(URL,KEY,{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}});
const USER_KEY='mayfit_user';
let mounted=false;
let loading=false;
let observer;

function current(){try{return JSON.parse(sessionStorage.getItem(USER_KEY))}catch{return null}}
function esc(v){return String(v??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]))}
function normalizedStatus(value){return value==='active'||value==='blocked'?value:'pending'}
function statusLabel(value){const s=normalizedStatus(value);return s==='active'?'Ativo':s==='blocked'?'Bloqueado':'Pendente'}

const css=`
#mayfit-students{margin:0 0 18px;padding:16px;border:1px solid #2d5038;border-radius:22px;background:#0d1711;color:#fff}
#mayfit-students .ms-head{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:12px}
#mayfit-students h2{margin:0;font-size:22px}
#mayfit-students .ms-actions{display:flex;gap:8px;flex-wrap:wrap}
#mayfit-students button{border:0;border-radius:12px;padding:10px 12px;font-weight:850;cursor:pointer}
#mayfit-students .ms-primary,.ms-approve{background:#78d532;color:#07110c}
#mayfit-students .ms-secondary{background:#1a2e20;color:#8fe52f;border:1px solid #355640}
#mayfit-students .ms-danger{background:#3a1b1b;color:#ffb6b6}
#mayfit-students .ms-search{width:100%;margin-bottom:12px;background:#08110b;border:1px solid #304939;color:#fff;border-radius:12px;padding:11px;box-sizing:border-box}
#mayfit-students .ms-list{display:grid;gap:10px}
#mayfit-students .ms-card{padding:12px;border:1px solid #294133;border-radius:16px;background:#101a14}
#mayfit-students .ms-row{display:flex;align-items:flex-start;justify-content:space-between;gap:12px}
#mayfit-students .ms-name{font-weight:900;font-size:16px}
#mayfit-students .ms-id{font-size:11px;color:#7f9185;margin-top:4px;word-break:break-all}
#mayfit-students .ms-badge{font-size:11px;font-weight:900;padding:5px 8px;border-radius:999px;background:#233528;color:#b8c8bd;white-space:nowrap}
#mayfit-students .ms-card-actions{display:flex;gap:7px;flex-wrap:wrap;margin-top:10px}
#mayfit-students .ms-msg,.ms-empty{color:#a9b8af;font-size:13px}
@media(max-width:620px){#mayfit-students{padding:13px;border-radius:18px}#mayfit-students .ms-head{align-items:flex-start;flex-direction:column}}
`;

function withTimeout(promise,ms=12000){return Promise.race([promise,new Promise((_,reject)=>setTimeout(()=>reject(new Error('A consulta demorou demais. Toque em Atualizar.')),ms))])}

async function loadStudents(root){
 if(loading||!root?.isConnected)return;
 loading=true;
 const refresh=root.querySelector('[data-refresh]');
 const msg=root.querySelector('.ms-msg');
 if(refresh)refresh.disabled=true;
 if(msg)msg.textContent='Carregando alunos...';
 try{
  const query=supabase.from('profiles').select('id,full_name,role,status,created_at').order('created_at',{ascending:false});
  const {data,error}=await withTimeout(query,12000);
  if(error)throw error;
  root._students=(data||[]).filter(p=>p.role!=='admin');
  render(root);
  if(msg)msg.textContent=`${root._students.length} aluno(s) encontrado(s)`;
 }catch(error){
  if(msg)msg.textContent='Não foi possível carregar os alunos: '+error.message;
  const list=root.querySelector('.ms-list');if(list)list.innerHTML='<div class="ms-empty">Toque em Atualizar para tentar novamente.</div>';
 }finally{
  loading=false;
  if(refresh)refresh.disabled=false;
 }
}

function render(root){
 const q=(root.querySelector('.ms-search')?.value||'').trim().toLowerCase();
 const data=(root._students||[]).filter(x=>!q||`${x.full_name||''} ${x.id||''}`.toLowerCase().includes(q));
 const list=root.querySelector('.ms-list');if(!list)return;
 if(!data.length){list.innerHTML='<div class="ms-empty">Nenhum aluno encontrado.</div>';return}
 list.innerHTML=data.map(x=>{const status=normalizedStatus(x.status);return `<article class="ms-card" data-id="${esc(x.id)}"><div class="ms-row"><div><div class="ms-name">${esc(x.full_name||'Aluno sem nome')}</div><div class="ms-id">Cadastro: ${esc(x.id)}</div></div><span class="ms-badge">${statusLabel(status)}</span></div><div class="ms-card-actions">${status==='pending'?'<button class="ms-approve" data-action="approve">Aprovar</button>':''}<button class="ms-secondary" data-action="edit">Editar</button>${status!=='pending'?`<button class="ms-secondary" data-action="toggle">${status==='blocked'?'Desbloquear':'Bloquear'}</button>`:''}<button class="ms-danger" data-action="delete">Excluir</button></div></article>`}).join('');
}

async function createStudent(root){
 const name=prompt('Nome completo do aluno:');if(!name?.trim())return;
 const email=prompt('E-mail do aluno:');if(!email?.trim())return;
 const password=prompt('Senha inicial com pelo menos 6 caracteres:');if(!password||password.length<6)return alert('A senha precisa ter pelo menos 6 caracteres.');
 const {data,error}=await secondary.auth.signUp({email:email.trim(),password,options:{data:{full_name:name.trim()}}});
 if(error)return alert('Não foi possível cadastrar: '+error.message);
 if(data.user)await supabase.from('profiles').update({full_name:name.trim(),role:'student',status:'active'}).eq('id',data.user.id);
 await loadStudents(root);
}

async function handleCard(root,button){
 const card=button.closest('.ms-card');const id=card?.dataset.id;const student=(root._students||[]).find(x=>x.id===id);if(!student)return;
 const action=button.dataset.action;button.disabled=true;
 try{
  if(action==='approve')await supabase.from('profiles').update({role:'student',status:'active'}).eq('id',id).throwOnError();
  if(action==='edit'){const name=prompt('Nome completo:',student.full_name||'');if(name?.trim())await supabase.from('profiles').update({full_name:name.trim()}).eq('id',id).throwOnError()}
  if(action==='toggle'){const next=normalizedStatus(student.status)==='blocked'?'active':'blocked';await supabase.from('profiles').update({status:next}).eq('id',id).throwOnError()}
  if(action==='delete'){if(!confirm(`Excluir definitivamente o aluno ${student.full_name||''}?`))return;await supabase.rpc('delete_student_account',{target_user_id:id}).throwOnError()}
  await loadStudents(root);
 }catch(error){alert('Não foi possível concluir: '+error.message)}finally{button.disabled=false}
}

function mount(){
 if(mounted||current()?.role!=='admin'||!supabase)return false;
 const main=document.querySelector('.app main');if(!main)return false;
 mounted=true;observer?.disconnect();
 if(!document.getElementById('mayfit-students-style')){const style=document.createElement('style');style.id='mayfit-students-style';style.textContent=css;document.head.appendChild(style)}
 const root=document.createElement('section');root.id='mayfit-students';root.innerHTML='<div class="ms-head"><div><h2>Alunos cadastrados</h2><div class="ms-msg">Painel carregado.</div></div><div class="ms-actions"><button class="ms-primary" data-new>Novo aluno</button><button class="ms-secondary" data-refresh>Atualizar</button></div></div><input class="ms-search" placeholder="Pesquisar por nome"><div class="ms-list"><div class="ms-empty">Carregando...</div></div>';
 main.prepend(root);
 root.querySelector('[data-new]').onclick=()=>createStudent(root);
 root.querySelector('[data-refresh]').onclick=()=>loadStudents(root);
 root.querySelector('.ms-search').oninput=()=>render(root);
 root.addEventListener('click',event=>{const button=event.target.closest('[data-action]');if(button)handleCard(root,button)});
 const start=()=>loadStudents(root);
 if('requestIdleCallback'in window)requestIdleCallback(start,{timeout:1500});else setTimeout(start,300);
 return true;
}

if(!mount()){observer=new MutationObserver(()=>mount());observer.observe(document.documentElement,{childList:true,subtree:true});setTimeout(()=>observer?.disconnect(),10000)}
