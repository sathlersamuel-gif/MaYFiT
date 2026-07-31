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

const loadOptionalModule = async (path, label) => {
  try {
    return await import(path);
  } catch (error) {
    console.error(`MaYFiT: módulo opcional indisponível (${label}):`, error);
    return null;
  }
};

async function bootstrap() {
  try {
    await import('./main.jsx');
    window.dispatchEvent(new Event('mayfit-ready'));
  } catch (error) {
    showFatalError(error);
    return;
  }

  await Promise.all([
    loadOptionalModule('./self-service-mode.js', 'modo individual'),
    loadOptionalModule('./admin-workout-tools.js', 'ferramentas de treino')
  ]);
}

bootstrap().catch(showFatalError);
