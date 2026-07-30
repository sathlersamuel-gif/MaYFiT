import { synchronizeAuthSession, installRealLogout } from './auth-session-controller.js';
import { initializeWorkoutCloudSync } from './workout-cloud-sync.js';
import './student-management.js';
import './admin-workout-tools.js';
import './supabase-login-bridge.js';

try {
  await synchronizeAuthSession();
} catch (error) {
  console.error('MaYFiT: não foi possível restaurar a sessão real:', error);
}

try {
  await initializeWorkoutCloudSync();
} catch (error) {
  console.error('MaYFiT: sincronização inicial indisponível:', error);
}

installRealLogout();
await import('./main.jsx');
