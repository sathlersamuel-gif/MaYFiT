import { supabase } from './lib/supabase.js';

const USER_KEY = 'mayfit_user';
const SIGNUP_COOLDOWN_KEY = 'mayfit_signup_cooldown_until';
const ADMIN_EMAIL = 'sathlersamuel@gmail.com';
const SUPPORT_WHATSAPP_URL = `https://wa.me/5569993057451?text=${encodeURIComponent('Olá, gostaria de fazer minha assinatura do MaYFiT.')}`;
let busy = false;
let signupBusy = false;
let recoveryBusy = false;

function blockedAccountError() {
  const error = new Error('Sua conta está bloqueada.');
  error.code = 'ACCOUNT_BLOCKED';
  return error;
}

function showBlockedScreen() {
  const page = document.querySelector('.login-page') || document.querySelector('#root');
  if (!page) {
    window.setTimeout(showBlockedScreen, 50);
    return;
  }

  page.innerHTML = `
    <style>
      .subscription-blocked-card{width:min(92vw,420px);margin:auto;padding:32px 24px;border:1px solid rgba(132,255,0,.22);border-radius:24px;background:rgba(14,22,16,.96);box-shadow:0 22px 70px rgba(0,0,0,.4);text-align:center;color:#fff}
      .subscription-blocked-icon{display:grid;place-items:center;width:68px;height:68px;margin:0 auto 18px;border-radius:50%;background:rgba(132,255,0,.12);font-size:30px}
      .subscription-blocked-card h1{margin:0 0 12px;font-size:clamp(25px,7vw,32px)}
      .subscription-blocked-card p{margin:0 auto 24px;max-width:330px;color:#c5cec7;line-height:1.55}
      .subscription-whatsapp{display:flex;align-items:center;justify-content:center;gap:10px;width:100%;padding:15px 18px;border-radius:14px;background:#25d366;color:#08230f!important;font-weight:800;text-decoration:none}
      .subscription-whatsapp svg{width:24px;height:24px;fill:currentColor}
      .subscription-back{margin-top:15px;border:0;background:transparent;color:#aeb8b0;text-decoration:underline;cursor:pointer}
    </style>
    <section class="subscription-blocked-card" aria-labelledby="subscription-blocked-title">
      <div class="subscription-blocked-icon" aria-hidden="true">🔒</div>
      <h1 id="subscription-blocked-title">Acesso bloqueado</h1>
      <p>Gostou do nosso app? Entre em contato com nosso suporte e faça sua assinatura.</p>
      <a class="subscription-whatsapp" href="${SUPPORT_WHATSAPP_URL}" target="_blank" rel="noopener noreferrer" aria-label="Falar com o suporte pelo WhatsApp">
        <svg viewBox="0 0 32 32" aria-hidden="true"><path d="M19.11 17.46c-.44-.22-2.6-1.28-3-1.43-.4-.15-.69-.22-.98.22-.29.44-1.13 1.43-1.38 1.72-.25.29-.51.33-.95.11-.44-.22-1.85-.68-3.52-2.18-1.3-1.16-2.18-2.59-2.44-3.03-.25-.44-.03-.68.19-.9.2-.2.44-.51.66-.77.22-.25.29-.44.44-.73.15-.29.07-.55-.04-.77-.11-.22-.98-2.37-1.35-3.25-.35-.85-.71-.73-.98-.74h-.84c-.29 0-.77.11-1.17.55-.4.44-1.54 1.5-1.54 3.66s1.57 4.24 1.79 4.53c.22.29 3.09 4.72 7.49 6.62 1.05.45 1.86.72 2.5.92 1.05.33 2 .29 2.76.18.84-.13 2.6-1.06 2.96-2.08.37-1.02.37-1.9.26-2.08-.11-.18-.4-.29-.84-.51M16.04 29.33h-.01a13.2 13.2 0 0 1-6.72-1.84l-.48-.29-5 1.31 1.33-4.87-.31-.5A13.19 13.19 0 0 1 2.82 16c0-7.28 5.93-13.21 13.22-13.21 3.53 0 6.85 1.38 9.35 3.87A13.13 13.13 0 0 1 29.25 16c0 7.29-5.93 13.22-13.21 13.22m11.24-24.5A15.79 15.79 0 0 0 16.04.18C7.31.18.21 7.28.21 16c0 2.78.73 5.49 2.12 7.88L.08 32l8.31-2.18a15.84 15.84 0 0 0 7.64 1.95h.01c8.72 0 15.82-7.1 15.82-15.82 0-4.23-1.63-8.2-4.58-11.12"/></svg>
        Falar com o suporte
      </a>
      <button class="subscription-back" type="button" onclick="window.location.reload()">Entrar com outra conta</button>
    </section>`;
}

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
  if (data.status === 'blocked') throw blockedAccountError();
  if (data.status === 'pending') {
    await supabase.from('profiles').update({ status: 'active' }).eq('id', user.id);
    data.status = 'active';
  }

  const email = String(user.email || '').trim().toLowerCase();
  const role = data.role === 'admin' && email === ADMIN_EMAIL ? 'admin' : 'student';

  return {
    id: data.id,
    name: data.full_name || user.email?.split('@')[0] || 'Usuário',
    email: user.email,
    role
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
    if (error?.code === 'ACCOUNT_BLOCKED') {
      showBlockedScreen();
      return;
    }
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
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ full_name: fullName.trim(), role: 'student', status: 'active' })
        .eq('id', data.user.id);
      if (profileError) throw profileError;
    }

    localStorage.setItem(SIGNUP_COOLDOWN_KEY, String(Date.now() + 15000));
    if (data.session && data.user) {
      const profile = await profileFor(data.user);
      sessionStorage.setItem(USER_KEY, JSON.stringify(profile));
      alert('Cadastro realizado com sucesso.');
      location.reload();
      return;
    }
    alert('Cadastro realizado com sucesso. Agora você já pode entrar.');
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
  if (!supabase) return;
  let localProfile = null;
  try { localProfile = JSON.parse(sessionStorage.getItem(USER_KEY) || 'null'); } catch {}
  const { data } = await supabase.auth.getSession();
  if (!data.session?.user) return;

  try {
    const profile = await profileFor(data.session.user);
    sessionStorage.setItem(USER_KEY, JSON.stringify(profile));
    const changedAccess = !localProfile || localProfile.role !== profile.role ||
      String(localProfile.email || '').toLowerCase() !== String(profile.email || '').toLowerCase();
    if (changedAccess) location.reload();
  } catch (error) {
    await supabase.auth.signOut();
    sessionStorage.removeItem(USER_KEY);
    if (error?.code === 'ACCOUNT_BLOCKED') showBlockedScreen();
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
  supabase.auth.onAuthStateChange(event => {
    if (event === 'PASSWORD_RECOVERY') setTimeout(finishPasswordRecovery, 150);
  });
  restoreSession();
  installLogoutSync();
  const observer = new MutationObserver(enhanceLogin);
  observer.observe(document.documentElement, { childList: true, subtree: true });
  enhanceLogin();
}
