import { runSaveMigrations } from './migrationRunner.js';
export const migrateIncomingSaveForHydration = (raw, normalizeToCurrent) => runSaveMigrations(raw, { mode: 'apply', normalizeToCurrent });
