import { initializeWorkoutCloudSync } from './workout-cloud-sync.js';
import './admin-workout-tools.js';

try {
  await initializeWorkoutCloudSync();
} catch (error) {
  console.error('MaYFiT: sincronização inicial indisponível:', error);
}

await import('./main.jsx');
