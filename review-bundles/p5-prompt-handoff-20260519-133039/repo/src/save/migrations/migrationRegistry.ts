import type { RegisteredMigrationStep } from './migrationTypes.js';
import { migrationSteps } from './steps/index.js';

export const migrationRegistry: RegisteredMigrationStep[] = [...migrationSteps].sort((a, b) => a.priority - b.priority);
