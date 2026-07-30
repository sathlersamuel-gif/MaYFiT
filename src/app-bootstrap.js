import { initializeWorkoutCloudSync } from './workout-cloud-sync.js';
import './student-management.js';
import './admin-workout-tools.js';
import './supabase-login-bridge.js';

try {
  await initializeWorkoutCloudSync();
} catch (error) {
  console.error('MaYFiT: sincronização inicial indisponível:', error);
}

await import('./main.jsx');