import { supabase } from './lib/supabase.js';

const USER_KEY='mayfit_user';
const VIEW_STUDENT_KEY='mayfit_view_student';
let busy=false;

function setMessage(form,text){
  let box=form.querySelector('.notice');
  if(!box){
    box=document.createElement('div');
    box.className='notice';
    const submit=form.querySelector('button.primary');
    form.insertBefore(box,submit);
  }
  box.textContent=text;
}

function normalizeRole(profile={}){
  const raw=String(profile.role||profile.user_role||'student').trim().toLowerCase();
  return ['admin','administrator','administrador'].includes(raw)?'admin':'student';
}

async function sessionUser(authUser){
  let profile={};
  const {data,error}=await supabase.from('profiles').select('*').eq('id',authUser.id).maybeSingle();
  if(!error&&data)profile=data;
  return {
    id:authUser.id,
    name:profile.full_name||authUser.user_metadata?.full_name||authUser.email?.split('@')[0]||'Usuário',
    email:authUser.email||'',
    role:normalizeRole(profile),
    status:profile.status||'active'
  };
}

async function handleLogin(event){
  const form=event.target;
  if(!(form instanceof HTMLFormElement)||!form.classList.contains('login-card')||!supabase||busy)return;
  event.preventDefault();
  event.stopImmediatePropagation();

  const inputs=form.querySelectorAll('input');
  const email=(inputs[0]?.value||'').trim().toLowerCase();
  const password=inputs[1]?.value||'';
  const button=form.querySelector('button.primary');
  if(!email||!password){setMessage(form,'Informe o e-mail e a senha.');return}

  busy=true;
  if(button){button.disabled=true;button.textContent='Entrando...'}
  try{
    const {data,error}=await supabase.auth.signInWithPassword({email,password});
    if(error)throw error;
    sessionStorage.setItem(USER_KEY,JSON.stringify(await sessionUser(data.user)));
    sessionStorage.removeItem(VIEW_STUDENT_KEY);
    location.reload();
  }catch(error){
    const raw=error?.message||'';
    let message=raw||'Não foi possível entrar.';
    if(/invalid login credentials/i.test(raw))message='E-mail ou senha inválidos.';
    if(/email not confirmed/i.test(raw))message='Confirme seu e-mail pelo link recebido e depois entre normalmente.';
    setMessage(form,message);
  }finally{
    busy=false;
    if(button){button.disabled=false;button.textContent='Entrar'}
  }
}

async function signup(form){
  if(busy)return;
  const name=prompt('Digite seu nome:');
  if(!name?.trim())return;
  const email=prompt('Digite seu e-mail:');
  if(!email?.trim())return;
  const password=prompt('Crie uma senha com pelo menos 6 caracteres:');
  if(!password||password.length<6){alert('A senha precisa ter pelo menos 6 caracteres.');return}

  busy=true;
  try{
    const {data,error}=await supabase.auth.signUp({
      email:email.trim().toLowerCase(),
      password,
      options:{data:{full_name:name.trim(),role:'student'}}
    });
    if(error)throw error;

    if(data.user){
      await supabase.from('profiles').upsert({
        id:data.user.id,
        full_name:name.trim(),
        role:'student',
        status:'active'
      },{onConflict:'id'});
    }

    if(data.session&&data.user){
      sessionStorage.setItem(USER_KEY,JSON.stringify(await sessionUser(data.user)));
      sessionStorage.removeItem(VIEW_STUDENT_KEY);
      location.reload();
      return;
    }

    setMessage(form,'Cadastro criado. Confirme seu e-mail pelo link recebido e depois entre com sua senha.');
    const inputs=form.querySelectorAll('input');
    if(inputs[0])inputs[0].value=email.trim().toLowerCase();
  }catch(error){
    const raw=error?.message||'';
    let message=raw||'Não foi possível criar a conta.';
    if(/already registered|already been registered/i.test(raw))message='Este e-mail já está cadastrado. Entre com sua senha ou use Esqueci minha senha.';
    setMessage(form,message);
  }finally{busy=false}
}

async function resetPassword(form){
  const typed=form.querySelector('input')?.value?.trim()||'';
  const email=prompt('Digite seu e-mail cadastrado:',typed);
  if(!email?.trim())return;
  const redirectTo=`${location.origin}${location.pathname}`;
  const {error}=await supabase.auth.resetPasswordForEmail(email.trim(),{redirectTo});
  if(error){setMessage(form,error.message);return}
  setMessage(form,'Enviamos o link para criar uma nova senha. Verifique também o spam.');
}

function enhanceLogin(){
  const form=document.querySelector('.login-card');
  if(!form)return;
  const inputs=form.querySelectorAll('input');
  if(inputs[0]?.value==='aluno@mayfit.com'||inputs[0]?.value==='admin@mayfit.com')inputs[0].value='';
  if(inputs[1]?.value==='123456')inputs[1].value='';

  let signupButton=form.querySelector('[data-self-signup]');
  const legacy=form.querySelector('.demo-switch');
  if(legacy){
    legacy.textContent='Criar minha conta';
    legacy.dataset.selfSignup='true';
    legacy.onclick=event=>{event.preventDefault();event.stopPropagation();signup(form)};
    signupButton=legacy;
  }
  if(!signupButton){
    signupButton=document.createElement('button');
    signupButton.type='button';
    signupButton.className='demo-switch';
    signupButton.dataset.selfSignup='true';
    signupButton.textContent='Criar minha conta';
    signupButton.onclick=()=>signup(form);
    form.appendChild(signupButton);
  }

  if(!form.querySelector('[data-reset-password]')){
    const reset=document.createElement('button');
    reset.type='button';
    reset.dataset.resetPassword='true';
    reset.textContent='Esqueci minha senha';
    reset.style.cssText='display:block;width:100%;margin:10px 0;padding:8px;border:0;background:transparent;color:#8df20b;font-weight:800;text-decoration:underline';
    reset.onclick=()=>resetPassword(form);
    form.insertBefore(reset,signupButton);
  }
}

document.addEventListener('submit',handleLogin,true);
const observer=new MutationObserver(enhanceLogin);
observer.observe(document.documentElement,{childList:true,subtree:true});
enhanceLogin();
