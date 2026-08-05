import { supabase } from './lib/supabase.js';

const USER_KEY = 'mayfit_user';
const SIGNUP_COOLDOWN_KEY = 'mayfit_signup_cooldown_until';
let busy = false;
let signupBusy = false;
let recoveryBusy = false;

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

function friendlyAuthError(error) {
  const message = String(error?.message || 'Não foi possível concluir o cadastro.');
  if (/email rate limit exceeded/i.test(message)) {
    localStorage.setItem(SIGNUP_COOLDOWN_KEY, String(Date.now() + 60000));
    return 'Foram feitas muitas tentativas em pouco tempo. Aguarde alguns minutos e tente novamente apenas uma vez.';
  }
  if (/user already registered|already been registered/i.test(message)) {
    return 'Este e-mail já possui cadastro. Entre com a senha ou use a opção Esqueci minha senha.';
  }
  return message;
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

async function requestPasswordReset(form) {
  if (recoveryBusy) return;
  const emailInput = form.querySelector('input');
  const typedEmail = emailInput?.value.trim() || '';
  const email = prompt('Digite o e-mail cadastrado:', typedEmail);
  if (!email?.trim()) return;

  recoveryBusy = true;
  try {
    const redirectTo = `${location.origin}${location.pathname}`;
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo });
    if (error) throw error;
    if (emailInput) emailInput.value = email.trim();
    setNotice(form, 'Enviamos um link para seu e-mail. Abra o link para criar uma nova senha.');
    alert('Link de recuperação enviado. Verifique também a caixa de spam.');
  } catch (error) {
    setNotice(form, friendlyAuthError(error));
  } finally {
    recoveryBusy = false;
  }
}

async function finishPasswordRecovery() {
  if (recoveryBusy) return;
  recoveryBusy = true;
  try {
    const password = prompt('Crie uma nova senha com pelo menos 6 caracteres:');
    if (!password) return;
    if (password.length < 6) {
      alert('A senha precisa ter pelo menos 6 caracteres. Abra novamente o link recebido e tente outra vez.');
      return;
    }
    const confirmation = prompt('Digite novamente a nova senha:');
    if (password !== confirmation) {
      alert('As senhas não são iguais. Abra novamente o link recebido e tente outra vez.');
      return;
    }

    const { error } = await supabase.auth.updateUser({ password });
    if (error) throw error;
    await supabase.auth.signOut();
    sessionStorage.removeItem(USER_KEY);
    history.replaceState({}, document.title, location.pathname);
    alert('Senha alterada com sucesso. Agora entre usando sua nova senha.');
    location.reload();
  } catch (error) {
    alert(`Não foi possível alterar a senha: ${error.message}`);
  } finally {
    recoveryBusy = false;
  }
}

async function signup(form) {
  if (signupBusy) return;
  const cooldownUntil = Number(localStorage.getItem(SIGNUP_COOLDOWN_KEY) || 0);
  if (cooldownUntil > Date.now()) {
    const seconds = Math.max(1, Math.ceil((cooldownUntil - Date.now()) / 1000));
    alert(`Aguarde ${seconds} segundos antes de tentar outro cadastro.`);
    return;
  }

  const fullName = prompt('Digite seu nome completo:');
  if (!fullName?.trim()) return;
  const email = prompt('Digite seu e-mail:');
  if (!email?.trim()) return;
  const password = prompt('Crie uma senha com pelo menos 6 caracteres:');
  if (!password || password.length < 6) {
    alert('A senha precisa ter pelo menos 6 caracteres.');
    return;
  }

  signupBusy = true;
  const signupButton = form.querySelector('.demo-switch');
  const originalText = signupButton?.textContent;
  if (signupButton) {
    signupButton.disabled = true;
    signupButton.textContent = 'Criando conta...';
  }

  try {
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: { data: { full_name: fullName.trim() } }
    });
    if (error) throw error;

    if (data.user) {
      await supabase
        .from('profiles')
        .update({ full_name: fullName.trim(), role: 'student', status: 'pending' })
        .eq('id', data.user.id);
    }

    localStorage.setItem(SIGNUP_COOLDOWN_KEY, String(Date.now() + 15000));
    alert('Cadastro enviado. Agora aguarde a aprovação do administrador.');
    const [emailInput] = form.querySelectorAll('input');
    emailInput.value = email.trim();
  } catch (error) {
    alert(friendlyAuthError(error));
  } finally {
    signupBusy = false;
    if (signupButton) {
      signupButton.disabled = false;
      signupButton.textContent = originalText || 'Criar nova conta';
    }
  }
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

  const forgotButton = document.createElement('button');
  forgotButton.type = 'button';
  forgotButton.textContent = 'Esqueci minha senha';
  forgotButton.dataset.passwordRecovery = 'true';
  forgotButton.style.cssText = 'display:block;width:100%;margin:10px 0 2px;padding:8px;border:0;background:transparent;color:#8df20b;font:800 14px system-ui,-apple-system,sans-serif;text-decoration:underline;cursor:pointer';
  forgotButton.onclick = event => {
    event.preventDefault();
    event.stopPropagation();
    requestPasswordReset(form);
  };
  const passwordLabel = inputs[1]?.closest('label');
  if (passwordLabel) passwordLabel.insertAdjacentElement('afterend', forgotButton);
  else form.insertBefore(forgotButton, form.querySelector('button.primary'));

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
      sessionStorage.removeItem('mayfit_selected_student_id');
    },
    true
  );
}

if (!supabase) {
  console.error('Supabase não configurado.');
} else {
  supabase.auth.onAuthStateChange(event => {
    if (event === 'PASSWORD_RECOVERY') setTimeout(finishPasswordRecovery, 150);
  });
  restoreSession();
  installLogoutSync();
  const observer = new MutationObserver(enhanceLogin);
  observer.observe(document.documentElement, { childList: true, subtree: true });
  enhanceLogin();
}
