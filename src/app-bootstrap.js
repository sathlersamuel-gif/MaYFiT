const showFatalError = (error) => {
  console.error('MaYFiT: falha ao abrir o aplicativo:', error);
  const root = document.getElementById('root');
  if (!root) return;
  root.innerHTML = `
    <main style="min-height:100vh;display:grid;place-items:center;padding:24px;background:#050706;color:#fff;font-family:system-ui,-apple-system,sans-serif;text-align:center">
      <section style="max-width:520px">
        <h1 style="margin:0 0 12px;color:#8df20b">MaYFiT</h1>
        <p style="margin:0 0 8px;font-weight:800">Não foi possível carregar o aplicativo.</p>
        <p style="margin:0 0 18px;color:#b9c8be;font-size:14px">Envie esta mensagem:</p>
        <code style="display:block;padding:12px;border:1px solid #33443a;border-radius:12px;background:#101a14;color:#ffb6b6;word-break:break-word">${String(error?.message || error || 'erro desconhecido')}</code>
      </section>
    </main>`;
};

try {
  await import('./main.jsx');
} catch (error) {
  showFatalError(error);
  throw error;
}

const loadOptionalModule = async (path, label) => {
  try {
    return await import(path);
  } catch (error) {
    console.error(`MaYFiT: módulo opcional indisponível (${label}):`, error);
    return null;
  }
};

const authModule = await loadOptionalModule('./auth-session-controller.js', 'sessão');
await loadOptionalModule('./supabase-login-bridge.js', 'login Supabase');
await loadOptionalModule('./self-service-mode.js', 'modo individual');
await loadOptionalModule('./admin-workout-tools.js', 'ferramentas de treino');

if (authModule) {
  try {
    await Promise.race([
      authModule.synchronizeAuthSession?.(),
      new Promise(resolve => setTimeout(resolve, 3500))
    ]);
  } catch (error) {
    console.error('MaYFiT: não foi possível restaurar a sessão:', error);
  }

  try {
    authModule.installRealLogout?.();
  } catch (error) {
    console.error('MaYFiT: não foi possível instalar o logout:', error);
  }
}

const syncModule = await loadOptionalModule('./workout-cloud-sync.js', 'sincronização');
syncModule?.initializeWorkoutCloudSync?.().catch(error => {
  console.error('MaYFiT: sincronização inicial indisponível:', error);
});
