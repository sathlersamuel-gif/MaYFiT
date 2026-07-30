import './admin-workout-tools.js';
import { initializeWorkoutCloudSync } from './workout-cloud-sync.js';

try {
  await initializeWorkoutCloudSync();
} catch (error) {
  console.error('MaYFiT: sincronização inicial indisponível:', error);
}

await import('./main.jsx');
