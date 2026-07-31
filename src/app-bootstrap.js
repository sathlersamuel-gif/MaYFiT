import { synchronizeAuthSession, installRealLogout } from './auth-session-controller.js';
import './supabase-login-bridge.js';
import './self-service-mode.js';
import './admin-workout-tools.js';
import { initializeWorkoutCloudSync } from './workout-cloud-sync.js';

const timeout = (ms) => new Promise(resolve => setTimeout(resolve, ms));

try {
  await Promise.race([
    synchronizeAuthSession(),
    timeout(3500)
  ]);
} catch (error) {
  console.error('MaYFiT: não foi possível restaurar a sessão:', error);
}

installRealLogout();

try {
  await import('./main.jsx');
} catch (error) {
  console.error('MaYFiT: falha ao abrir o aplicativo:', error);
  const root = document.getElementById('root');
  if (root) {
    root.innerHTML = `
      <main style="min-height:100vh;display:grid;place-items:center;padding:24px;background:#050706;color:#fff;font-family:system-ui,-apple-system,sans-serif;text-align:center">
        <section style="max-width:520px">
          <h1 style="margin:0 0 12px;color:#8df20b">MaYFiT</h1>
          <p style="margin:0 0 8px;font-weight:800">Não foi possível carregar o aplicativo.</p>
          <p style="margin:0 0 18px;color:#b9c8be;font-size:14px">Atualize a página. Se continuar, envie esta mensagem:</p>
          <code style="display:block;padding:12px;border:1px solid #33443a;border-radius:12px;background:#101a14;color:#ffb6b6;word-break:break-word">${String(error?.message || error || 'erro desconhecido')}</code>
        </section>
      </main>`;
  }
}

initializeWorkoutCloudSync().catch(error => {
  console.error('MaYFiT: sincronização inicial indisponível:', error);
});
