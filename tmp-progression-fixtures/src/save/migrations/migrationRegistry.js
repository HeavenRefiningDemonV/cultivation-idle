import { migrationSteps } from './steps/index.js';
export const migrationRegistry = [...migrationSteps].sort((a, b) => a.priority - b.priority);
