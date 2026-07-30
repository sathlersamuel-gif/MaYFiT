import { supabase } from './lib/supabase.js';

const USER_KEY='mayfit_user';

function setMessage(form,text){
  let box=form.querySelector('.notice');
  if(!box){box=document.createElement('div');box.className='notice';const submit=form.querySelector('button.primary');form.insertBefore(box,submit)}
  box.textContent=text;
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
    const {data:profile,error:profileError}=await supabase.from('profiles').select('id,full_name,role,status').eq('id',authUser.id).maybeSingle();
    if(profileError)throw profileError;
    if(!profile)throw new Error('Cadastro não encontrado no sistema.');
    if(profile.status==='pending')throw new Error('Seu cadastro ainda aguarda aprovação do administrador.');
    if(profile.status==='blocked')throw new Error('Seu acesso está bloqueado. Fale com o administrador.');
    const user={id:profile.id,name:profile.full_name||authUser.email?.split('@')[0]||'Aluno',email:authUser.email||email,role:profile.role||'student',status:profile.status||'active'};
    sessionStorage.setItem(USER_KEY,JSON.stringify(user));
    location.reload();
  }catch(error){
    const msg=/invalid login credentials/i.test(error?.message||'')?'E-mail ou senha inválidos. Confira a senha criada.':(error?.message||'Não foi possível entrar.');
    setMessage(form,msg);
    await supabase.auth.signOut().catch(()=>{});
  }finally{
    if(button){button.disabled=false;button.textContent='Entrar'}
  }
}

document.addEventListener('submit',handleLogin,true);
