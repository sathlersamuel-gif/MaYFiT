import { supabase } from './lib/supabase.js';

const USER_KEY = 'mayfit_user';
let busy = false;

function setNotice(form, message) {
  let notice = form.querySelector('.notice');
  if (!notice) {
    notice = document.createElement('div');
    notice.className = 'notice';
    const primary = form.querySelector('button.primary');
    form.insertBefore(notice, primary);
  }
  notice.textContent = message;
}

async function profileFor(user) {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, role, status')
    .eq('id', user.id)
    .single();

  if (error) throw error;
  if (data.status === 'pending') throw new Error('Seu cadastro ainda está aguardando aprovação.');
  if (data.status === 'blocked') throw new Error('Sua conta está bloqueada.');

  return {
    id: data.id,
    name: data.full_name || user.email?.split('@')[0] || 'Usuário',
    email: user.email,
    role: data.role
  };
}

async function login(form) {
  if (busy) return;
  busy = true;
  const [emailInput, passwordInput] = form.querySelectorAll('input');
  const button = form.querySelector('button.primary');
  button.disabled = true;
  button.textContent = 'Entrando...';

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: emailInput.value.trim(),
      password: passwordInput.value
    });
    if (error) throw error;

    const profile = await profileFor(data.user);
    sessionStorage.setItem(USER_KEY, JSON.stringify(profile));
    location.reload();
  } catch (error) {
    await supabase.auth.signOut();
    const message = /Invalid login credentials/i.test(error.message)
      ? 'E-mail ou senha incorretos.'
      : error.message;
    setNotice(form, message);
    button.disabled = false;
    button.textContent = 'Entrar';
    busy = false;
  }
}

async function signup(form) {
  const fullName = prompt('Digite seu nome completo:');
  if (!fullName?.trim()) return;
  const email = prompt('Digite seu e-mail:');
  if (!email?.trim()) return;
  const password = prompt('Crie uma senha com pelo menos 6 caracteres:');
  if (!password || password.length < 6) {
    alert('A senha precisa ter pelo menos 6 caracteres.');
    return;
  }

  const { error } = await supabase.auth.signUp({
    email: email.trim(),
    password,
    options: { data: { full_name: fullName.trim() } }
  });

  if (error) {
    alert(error.message);
    return;
  }

  alert('Cadastro criado. Aguarde a aprovação do administrador para entrar.');
  const [emailInput] = form.querySelectorAll('input');
  emailInput.value = email.trim();
}

function enhanceLogin() {
  const form = document.querySelector('.login-card');
  if (!form || form.dataset.supabaseReady === 'true') return;
  form.dataset.supabaseReady = 'true';

  const inputs = form.querySelectorAll('input');
  if (inputs[0]) {
    inputs[0].value = '';
    inputs[0].placeholder = 'seuemail@exemplo.com';
  }
  if (inputs[1]) inputs[1].value = '';

  const demo = form.querySelector('.demo-switch');
  if (demo) {
    demo.textContent = 'Criar nova conta';
    demo.onclick = event => {
      event.preventDefault();
      event.stopPropagation();
      signup(form);
    };
  }

  form.addEventListener(
    'submit',
    event => {
      event.preventDefault();
      event.stopImmediatePropagation();
      login(form);
    },
    true
  );
}

async function restoreSession() {
  if (!supabase || sessionStorage.getItem(USER_KEY)) return;
  const { data } = await supabase.auth.getSession();
  if (!data.session?.user) return;

  try {
    const profile = await profileFor(data.session.user);
    sessionStorage.setItem(USER_KEY, JSON.stringify(profile));
    location.reload();
  } catch {
    await supabase.auth.signOut();
  }
}

function installLogoutSync() {
  document.addEventListener(
    'click',
    event => {
      const button = event.target.closest('button');
      if (!button || button.textContent.trim() !== 'Sair') return;
      supabase?.auth.signOut();
      sessionStorage.removeItem(USER_KEY);
      sessionStorage.removeItem('mayfit_admin_return');
    },
    true
  );
}

if (!supabase) {
  console.error('Supabase não configurado.');
} else {
  restoreSession();
  installLogoutSync();
  const observer = new MutationObserver(enhanceLogin);
  observer.observe(document.documentElement, { childList: true, subtree: true });
  enhanceLogin();
}
