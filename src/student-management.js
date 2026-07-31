const USER_KEY='mayfit_user';
const VIEW_STUDENT_KEY='mayfit_view_student';
const COLLECTION='mayfit_users';
let mounted=false;
let loading=false;
let observer;

const css=`
#mayfit-settings-button{position:static;flex:0 0 auto;width:46px;height:46px;display:grid;place-items:center;border:1px solid #41634d;border-radius:15px;background:#101a14;color:#8df20b;font-size:23px;box-shadow:none;cursor:pointer;margin-left:8px}
#mayfit-settings-screen{position:fixed;inset:0;z-index:9500;overflow:auto;background:#050706;color:#fff;padding:max(18px,env(safe-area-inset-top)) 14px max(90px,env(safe-area-inset-bottom));font-family:system-ui,-apple-system,sans-serif;box-sizing:border-box}
#mayfit-settings-screen[hidden],#mayfit-students[hidden],.ms-menu[hidden]{display:none!important}
.ms-top{display:flex;align-items:center;gap:12px;margin-bottom:20px}.ms-back{width:46px;height:46px;border:1px solid #31543b;border-radius:15px;background:#0b1710;color:#fff;font-size:26px}.ms-top h1{margin:0;font-size:26px}
.ms-menu{display:grid;gap:12px}.ms-menu-button{display:flex;align-items:center;justify-content:space-between;width:100%;padding:18px;border:1px solid #31543b;border-radius:18px;background:#0d1711;color:#fff;text-align:left;font-size:18px;font-weight:900}.ms-menu-button span{color:#8df20b;font-size:24px}
#mayfit-students{padding:16px;border:1px solid #2d5038;border-radius:22px;background:#0d1711;color:#fff}
#mayfit-students .ms-head{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:12px}#mayfit-students h2{margin:0;font-size:22px}
#mayfit-students .ms-actions{display:flex;gap:8px;flex-wrap:wrap}#mayfit-students button{border:0;border-radius:12px;padding:10px 12px;font-weight:850;cursor:pointer}#mayfit-students button:disabled{opacity:.55}
.ms-primary,.ms-approve,.ms-assign{background:#78d532;color:#07110c}.ms-secondary{background:#1a2e20;color:#8fe52f;border:1px solid #355640!important}.ms-danger{background:#3a1b1b;color:#ffb6b6}
.ms-search{width:100%;margin-bottom:12px;background:#08110b;border:1px solid #304939;color:#fff;border-radius:12px;padding:11px;box-sizing:border-box}.ms-list{display:grid;gap:10px}.ms-card{padding:12px;border:1px solid #294133;border-radius:16px;background:#101a14}.ms-card.pending{border-color:#9b7625;background:#1c180d}.ms-row{display:flex;align-items:flex-start;justify-content:space-between;gap:12px}.ms-name{font-weight:900;font-size:16px}.ms-id{font-size:11px;color:#7f9185;margin-top:4px;word-break:break-all}.ms-badge{font-size:11px;font-weight:900;padding:5px 8px;border-radius:999px;background:#233528;color:#b8c8bd;white-space:nowrap}.ms-badge.approved{background:#173b20;color:#91ea50}.ms-badge.blocked{background:#3a2020;color:#ffadad}.ms-badge.pending{background:#4a3812;color:#ffd76a}.ms-card-actions{display:flex;gap:7px;flex-wrap:wrap;margin-top:10px}.ms-empty{padding:18px;text-align:center;color:#98a69d}.ms-msg{margin:8px 0;color:#a9b8af;font-size:13px}.ms-pending-count{display:inline-grid;place-items:center;min-width:20px;height:20px;margin-left:6px;padding:0 5px;border-radius:999px;background:#ffd35a;color:#241b00;font-size:11px;font-weight:950}
@media(max-width:620px){#mayfit-settings-button{width:42px;height:42px;margin-left:6px;font-size:21px}.ms-head{align-items:flex-start!important;flex-direction:column}.ms-actions{width:100%}.ms-actions button{flex:1}}
`;

function firebaseDb(){return window.MaYFiTFirebase?.db||null}
function current(){try{return JSON.parse(sessionStorage.getItem(USER_KEY))}catch{return null}}
function esc(v){return String(v??'').replace(/[&<>'\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','\"':'&quot;'}[c]))}
function normalizedStatus(value){return value==='approved'||value==='blocked'?value:'pending'}
function statusLabel(value){const s=normalizedStatus(value);return s==='approved'?'Ativo':s==='blocked'?'Bloqueado':'Pendente'}

async function loadStudents(root){
 if(loading)return;loading=true;const refresh=root.querySelector('[data-refresh]');const msg=root.querySelector('.ms-msg');if(refresh)refresh.disabled=true;msg.textContent='Carregando alunos...';
 try{
  const db=firebaseDb();if(!db)throw new Error('Firebase ainda não carregou.');
  const snap=await db.collection(COLLECTION).get();
  root._students=snap.docs.map(doc=>({id:doc.id,...doc.data()})).filter(p=>p.role!=='admin').sort((a,b)=>String(b.createdAt?.seconds||0).localeCompare(String(a.createdAt?.seconds||0)));
  const pending=root._students.filter(p=>normalizedStatus(p.status)==='pending').length;
  msg.innerHTML=`${root._students.length} aluno(s) encontrado(s)${pending?` <span class="ms-pending-count">${pending}</span> aguardando aprovação`:''}`;render(root)
 }catch(error){msg.textContent='Não foi possível carregar os alunos: '+error.message;root.querySelector('.ms-list').innerHTML='<div class="ms-empty">Falha ao consultar o banco de dados.</div>'}
 finally{loading=false;if(refresh)refresh.disabled=false}
}

function render(root){
 const q=(root.querySelector('.ms-search').value||'').trim().toLowerCase();const data=(root._students||[]).filter(x=>!q||`${x.fullName||''} ${x.email||''} ${x.id||''}`.toLowerCase().includes(q));const list=root.querySelector('.ms-list');if(!data.length){list.innerHTML='<div class="ms-empty">Nenhum aluno encontrado.</div>';return}
 list.innerHTML=data.map(x=>{const status=normalizedStatus(x.status);const approve=status==='pending'?'<button class="ms-approve" data-action="approve">Aprovar aluno</button>':'';const assign=status==='approved'?'<button class="ms-assign" data-action="view">Atribuir treino</button>':'';const toggle=status==='pending'?'':`<button class="ms-secondary" data-action="toggle">${status==='blocked'?'Desbloquear':'Bloquear'}</button>`;return `<article class="ms-card ${status}" data-id="${esc(x.id)}"><div class="ms-row"><div><div class="ms-name">${esc(x.fullName||'Aluno sem nome')}</div><div class="ms-id">${esc(x.email||'')}<br>Cadastro: ${esc(x.id)}</div></div><span class="ms-badge ${status}">${statusLabel(status)}</span></div><div class="ms-card-actions">${approve}${assign}<button class="ms-secondary" data-action="edit">Editar</button>${toggle}<button class="ms-danger" data-action="delete">Excluir</button></div></article>`}).join('')
}

async function createStudent(){alert('Para cadastrar um aluno, use o botão “Criar nova conta” na tela de entrada. Depois aprove o cadastro aqui.')}

async function handleCard(root,button){
 const card=button.closest('.ms-card');const id=card?.dataset.id;const student=(root._students||[]).find(x=>x.id===id);if(!student)return;const action=button.dataset.action;const db=firebaseDb();if(!db)return alert('Firebase ainda não carregou.');
 if(action==='view'){const admin=current();if(!admin||admin.role!=='admin'){alert('Sessão de administrador inválida. Entre novamente.');return}sessionStorage.setItem(VIEW_STUDENT_KEY,JSON.stringify({id:student.id,name:student.fullName||'Aluno'}));location.reload();return}
 button.disabled=true;
 try{
  const ref=db.collection(COLLECTION).doc(id);
  if(action==='approve')await ref.set({role:'student',status:'approved',updatedAt:firebase.firestore.FieldValue.serverTimestamp()},{merge:true});
  if(action==='edit'){const name=prompt(`Editar aluno: ${student.fullName||'Aluno'}`,student.fullName||'');if(!name?.trim())return;await ref.set({fullName:name.trim(),updatedAt:firebase.firestore.FieldValue.serverTimestamp()},{merge:true})}
  if(action==='toggle'){const next=normalizedStatus(student.status)==='blocked'?'approved':'blocked';const label=next==='blocked'?'bloquear':'desbloquear';if(!confirm(`Deseja ${label} o aluno ${student.fullName||'Aluno'}?`))return;await ref.set({status:next,updatedAt:firebase.firestore.FieldValue.serverTimestamp()},{merge:true})}
  if(action==='delete'){if(!confirm(`Excluir o cadastro do aluno ${student.fullName||'Aluno'} do MaYFiT?`))return;button.textContent='Excluindo...';await ref.delete();alert('Cadastro removido do MaYFiT. O login do Firebase permanece registrado por segurança.')}
  await loadStudents(root)
 }catch(error){alert('Não foi possível concluir: '+error.message);await loadStudents(root)}finally{button.disabled=false;if(action==='delete')button.textContent='Excluir'}
}

function mount(){
 const db=firebaseDb();if(mounted||current()?.role!=='admin'||!db)return false;const app=document.querySelector('.app');const header=app?.querySelector('header');if(!app||!header)return false;mounted=true;observer?.disconnect();
 if(!document.getElementById('mayfit-students-style')){const style=document.createElement('style');style.id='mayfit-students-style';style.textContent=css;document.head.appendChild(style)}
 const gear=document.createElement('button');gear.id='mayfit-settings-button';gear.className='icon';gear.type='button';gear.setAttribute('aria-label','Configurações');gear.textContent='⚙';header.appendChild(gear);
 const screen=document.createElement('section');screen.id='mayfit-settings-screen';screen.hidden=true;screen.innerHTML='<div class="ms-top"><button type="button" class="ms-back" data-close>‹</button><h1>Configurações</h1></div><div class="ms-menu"><button type="button" class="ms-menu-button" data-open-students>Alunos <span>›</span></button></div><section id="mayfit-students" hidden><div class="ms-head"><div><h2>Alunos</h2><div class="ms-msg">Conectando ao banco...</div></div><div class="ms-actions"><button class="ms-primary" data-new>Novo aluno</button><button class="ms-secondary" data-refresh>Atualizar</button></div></div><input class="ms-search" placeholder="Pesquisar por nome ou e-mail"><div class="ms-list"></div></section>';document.body.appendChild(screen);
 const root=screen.querySelector('#mayfit-students');const menu=screen.querySelector('.ms-menu');gear.onclick=()=>{screen.hidden=false;menu.hidden=false;root.hidden=true;screen.querySelector('h1').textContent='Configurações'};screen.querySelector('[data-close]').onclick=()=>{if(!root.hidden){root.hidden=true;menu.hidden=false;screen.querySelector('h1').textContent='Configurações'}else screen.hidden=true};screen.querySelector('[data-open-students]').onclick=()=>{menu.hidden=true;root.hidden=false;screen.querySelector('h1').textContent='Alunos';loadStudents(root)};root.querySelector('[data-new]').onclick=createStudent;root.querySelector('[data-refresh]').onclick=()=>loadStudents(root);root.querySelector('.ms-search').oninput=()=>render(root);root.addEventListener('click',event=>{const button=event.target.closest('[data-action]');if(button)handleCard(root,button)});return true
}

if(!mount()){observer=new MutationObserver(()=>mount());observer.observe(document.documentElement,{childList:true,subtree:true});window.setTimeout(()=>observer?.disconnect(),20000)}