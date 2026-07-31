import { synchronizeAuthSession, installRealLogout } from './auth-session-controller.js';
import './supabase-login-bridge.js';
import './self-service-mode.js';
import './admin-workout-tools.js';
import { initializeWorkoutCloudSync } from './workout-cloud-sync.js';

try {
  await synchronizeAuthSession();
} catch (error) {
  console.error('MaYFiT: não foi possível restaurar a sessão:', error);
}

try {
  await initializeWorkoutCloudSync();
} catch (error) {
  console.error('MaYFiT: sincronização inicial indisponível:', error);
}

installRealLogout();
await import('./main.jsx');
