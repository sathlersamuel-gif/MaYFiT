(function(){
'use strict';

const ADMIN_EMAIL='sathlersamuel@gmail.com';
const USER_KEY='mayfit_user';
const firebaseConfig={
  apiKey:'AIzaSyC7kLlmbU3mAWeyDj_oPKAWsJTU1QU_QjQ',
  authDomain:'samuel-comissoes-pro.firebaseapp.com',
  projectId:'samuel-comissoes-pro',
  storageBucket:'samuel-comissoes-pro.firebasestorage.app',
  messagingSenderId:'217399693317',
  appId:'1:217399693317:web:fa4d7971cf4e869cbc4c6c'
};

if(!window.firebase){console.error('Firebase não carregado.');return;}
if(!firebase.apps.length)firebase.initializeApp(firebaseConfig);
const auth=firebase.auth();
const db=firebase.firestore();
auth.useDeviceLanguage();
let busy=false;

function notice(form,text){
  let box=form.querySelector('.notice');
  if(!box){box=document.createElement('div');box.className='notice';form.insertBefore(box,form.querySelector('button.primary'));}
  box.textContent=text;
}
function errorText(e){
  const map={
    'auth/email-already-in-use':'Este e-mail já possui uma conta no Firebase. Entre com sua senha ou use Esqueci minha senha.',
    'auth/invalid-email':'E-mail inválido.',
    'auth/weak-password':'A senha precisa ter pelo menos 6 caracteres.',
    'auth/user-not-found':'Conta não encontrada.',
    'auth/wrong-password':'Senha incorreta.',
    'auth/invalid-credential':'E-mail ou senha incorretos.',
    'auth/network-request-failed':'Falha de internet. Tente novamente.'
  };
  return map[e&&e.code]||e?.message||'Não foi possível concluir.';
}
async function ensureProfile(user,name=''){
  const ref=db.collection('mayfit_users').doc(user.uid);
  const snap=await ref.get();
  const email=String(user.email||'').toLowerCase();
  if(!snap.exists){
    await ref.set({uid:user.uid,email,fullName:name||user.displayName||email.split('@')[0],role:email===ADMIN_EMAIL?'admin':'student',status:email===ADMIN_EMAIL?'approved':'pending',createdAt:firebase.firestore.FieldValue.serverTimestamp(),updatedAt:firebase.firestore.FieldValue.serverTimestamp()},{merge:true});
  }
  const fresh=await ref.get();
  const data=fresh.data()||{};
  if(email===ADMIN_EMAIL&&(data.role!=='admin'||data.status!=='approved')){
    await ref.set({role:'admin',status:'approved',updatedAt:firebase.firestore.FieldValue.serverTimestamp()},{merge:true});
    data.role='admin';data.status='approved';
  }
  return {id:user.uid,name:data.fullName||user.displayName||email.split('@')[0],email:user.email,role:data.role||'student',status:data.status||'pending'};
}
async function login(form){
  if(busy)return;busy=true;
  const inputs=form.querySelectorAll('input');
  const email=inputs[0]?.value.trim()||'';
  const password=inputs[1]?.value||'';
  const button=form.querySelector('button.primary');
  button.disabled=true;button.textContent='Entrando...';
  try{
    const cred=await auth.signInWithEmailAndPassword(email,password);
    const profile=await ensureProfile(cred.user);
    if(profile.status==='pending')throw new Error('Seu cadastro ainda está aguardando aprovação do administrador.');
    if(profile.status==='blocked')throw new Error('Seu acesso está bloqueado.');
    sessionStorage.setItem(USER_KEY,JSON.stringify(profile));
    location.reload();
  }catch(e){
    notice(form,errorText(e));
    button.disabled=false;button.textContent='Entrar';busy=false;
  }
}
async function signup(form){
  const name=prompt('Digite seu nome completo:');if(!name?.trim())return;
  const email=prompt('Digite seu e-mail:');if(!email?.trim())return;
  const password=prompt('Crie uma senha com pelo menos 6 caracteres:');if(!password||password.length<6){alert('A senha precisa ter pelo menos 6 caracteres.');return;}
  try{
    const cred=await auth.createUserWithEmailAndPassword(email.trim(),password);
    await cred.user.updateProfile({displayName:name.trim()});
    const profile=await ensureProfile(cred.user,name.trim());
    await auth.signOut();sessionStorage.removeItem(USER_KEY);
    alert(profile.role==='admin'?'Administrador criado. Agora entre com seu e-mail e senha.':'Cadastro criado e enviado para aprovação.');
    location.reload();
  }catch(e){alert(errorText(e));}
}
async function reset(form){
  const typed=form.querySelector('input')?.value.trim()||'';
  const email=prompt('Digite o e-mail cadastrado:',typed);if(!email?.trim())return;
  try{await auth.sendPasswordResetEmail(email.trim());alert('Link para criar uma nova senha enviado ao seu e-mail. Verifique também o spam.');}
  catch(e){alert(errorText(e));}
}
function enhance(){
  const form=document.querySelector('.login-card');if(!form||form.dataset.firebaseReady==='1')return;
  form.dataset.firebaseReady='1';
  const inputs=form.querySelectorAll('input');if(inputs[0]){inputs[0].value='';inputs[0].placeholder='seuemail@exemplo.com';}if(inputs[1])inputs[1].value='';
  const demo=form.querySelector('.demo-switch');if(demo){demo.textContent='Criar nova conta';demo.onclick=e=>{e.preventDefault();e.stopPropagation();signup(form);};}
  const forgot=document.createElement('button');forgot.type='button';forgot.textContent='Esqueci minha senha';forgot.style.cssText='display:block;width:100%;margin:10px 0 2px;padding:8px;border:0;background:transparent;color:#8df20b;font:800 14px system-ui;text-decoration:underline';forgot.onclick=e=>{e.preventDefault();e.stopPropagation();reset(form);};
  const label=inputs[1]?.closest('label');if(label)label.insertAdjacentElement('afterend',forgot);
  form.addEventListener('submit',e=>{e.preventDefault();e.stopImmediatePropagation();login(form);},true);
}
async function restore(){
  auth.onAuthStateChanged(async user=>{
    if(!user){sessionStorage.removeItem(USER_KEY);enhance();return;}
    try{
      const profile=await ensureProfile(user);
      if(profile.status!=='approved'){await auth.signOut();sessionStorage.removeItem(USER_KEY);return;}
      const current=sessionStorage.getItem(USER_KEY);
      if(!current){sessionStorage.setItem(USER_KEY,JSON.stringify(profile));location.reload();}
    }catch(e){console.error(e);}
  });
}
document.addEventListener('click',e=>{const b=e.target.closest('button');if(b&&b.textContent.trim()==='Sair'){auth.signOut();sessionStorage.removeItem(USER_KEY);}},true);
new MutationObserver(enhance).observe(document.documentElement,{childList:true,subtree:true});
enhance();restore();
window.MaYFiTFirebase={auth,db};
})();