import { supabase } from './lib/supabase.js';

const USER_KEY='mayfit_user';
const VIEW_STUDENT_KEY='mayfit_view_student';

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

function removeDemoControls(){
  document.querySelectorAll('.demo-switch').forEach(button=>button.remove());
  const inputs=document.querySelectorAll('.login-card input');
  if(inputs[0]?.value==='aluno@mayfit.com')inputs[0].value='';
  if(inputs[1]?.value==='123456')inputs[1].value='';
}

async function handleLogin(event){
  const form=event.target;
  if(!(form instanceof HTMLFormElement)||!form.classList.contains('login-card')||!supabase)return;
  event.preventDefault();
  event.stopImmediatePropagation();

  const inputs=form.querySelectorAll('input');
  const email=(inputs[0]?.value||'').trim().toLowerCase();
  const password=inputs[1]?.value||'';
  const button=form.querySelector('button.primary');
  if(!email||!password){setMessage(form,'Informe o e-mail e a senha.');return}

  if(button){button.disabled=true;button.textContent='Entrando...'}
  try{
    const {data,error}=await supabase.auth.signInWithPassword({email,password});
    if(error)throw error;

    const authUser=data.user;
    const {data:profile,error:profileError}=await supabase
      .from('profiles')
      .select('id,full_name,role,status')
      .eq('id',authUser.id)
      .maybeSingle();

    if(profileError)throw profileError;
    if(!profile)throw new Error('Seu cadastro não foi encontrado no sistema.');
    if(profile.status==='pending')throw new Error('Seu cadastro ainda aguarda aprovação do administrador.');
    if(profile.status==='blocked')throw new Error('Seu acesso está bloqueado. Fale com o administrador.');

    const user={
      id:profile.id,
      name:profile.full_name||authUser.user_metadata?.full_name||authUser.email?.split('@')[0]||'Aluno',
      email:authUser.email||email,
      role:profile.role||'student',
      status:profile.status||'active'
    };

    sessionStorage.setItem(USER_KEY,JSON.stringify(user));
    sessionStorage.removeItem(VIEW_STUDENT_KEY);
    location.reload();
  }catch(error){
    const raw=error?.message||'';
    let message=raw||'Não foi possível entrar.';
    if(/invalid login credentials/i.test(raw))message='E-mail ou senha inválidos. Confira exatamente o e-mail e a senha cadastrados.';
    if(/email not confirmed/i.test(raw))message='O e-mail ainda não foi confirmado. Abra o e-mail de confirmação enviado pelo sistema.';
    setMessage(form,message);
    await supabase.auth.signOut().catch(()=>{});
  }finally{
    if(button){button.disabled=false;button.textContent='Entrar'}
  }
}

document.addEventListener('submit',handleLogin,true);
const observer=new MutationObserver(removeDemoControls);
observer.observe(document.documentElement,{childList:true,subtree:true});
removeDemoControls();
