// Entrada exclusiva da versão de desenvolvimento publicada no GitHub Pages.
// Mantém a aplicação principal intacta e carrega as extensões na ordem correta.
import './main.jsx';
import './supabase-auth-bridge.js';
import './student-management.js';
import './workout-interactions.js';
import './workout-history.js';

// Remove caches e service workers de tentativas antigas do GitHub Pages.
if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(registrations.map(registration => registration.unregister()));
      if ('caches' in window) {
        const keys = await caches.keys();
        await Promise.all(keys.map(key => caches.delete(key)));
      }
    } catch (error) {
      console.warn('Não foi possível limpar o cache antigo:', error);
    }
  });
}
