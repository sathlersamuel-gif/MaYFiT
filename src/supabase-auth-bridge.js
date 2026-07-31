const RESET_VERSION = 'mayfit_local_auth_reset_v1';
const STORE = 'mayfit_v9';
const LEGACY_STORE = 'mayfit_v8';
const SESSION_USER = 'mayfit_user';

function askRequired(message, initialValue = '') {
  let value = initialValue;
  while (!String(value || '').trim()) {
    value = prompt(message, value || '');
    if (value === null) return null;
  }
  return String(value).trim();
}

function createFreshAdministrator() {
  if (localStorage.getItem(RESET_VERSION) === 'done') return;

  localStorage.removeItem(STORE);
  localStorage.removeItem(LEGACY_STORE);
  localStorage.removeItem('mayfit_signup_cooldown_until');
  sessionStorage.removeItem(SESSION_USER);
  sessionStorage.removeItem('mayfit_admin_return');

  const name = askRequired('Digite seu nome para criar o novo administrador:', 'Samuel');
  if (!name) return;

  const email = askRequired('Digite seu e-mail de administrador:');
  if (!email) return;

  let password = '';
  while (password.length < 6) {
    const typed = prompt('Crie uma nova senha com pelo menos 6 caracteres:');
    if (typed === null) return;
    password = typed;
    if (password.length < 6) alert('A senha precisa ter pelo menos 6 caracteres.');
  }

  const confirmation = prompt('Digite novamente a nova senha:');
  if (confirmation !== password) {
    alert('As senhas não são iguais. Abra o aplicativo novamente e repita o cadastro.');
    return;
  }

  const adminId = `admin-${Date.now()}`;
  const cleanData = {
    users: [{
      id: adminId,
      name,
      email: email.toLowerCase(),
      password,
      role: 'admin',
      status: 'approved',
      phone: '',
      createdAt: new Date().toISOString()
    }],
    workouts: {},
    sessions: {},
    measurements: {},
    photos: {}
  };

  localStorage.setItem(STORE, JSON.stringify(cleanData));
  localStorage.setItem(RESET_VERSION, 'done');
  alert('Administrador criado com sucesso. Entre usando o novo e-mail e a nova senha.');
  location.reload();
}

createFreshAdministrator();
