import type { MigrationStep } from '../../migrationTypes.js';
import { v2_1_0_backfill_onboarding_state } from './backfillOnboardingState.js';
import { v2_1_0_backfill_training_state } from './backfillTrainingState.js';

export const v2_1_0MigrationPack: MigrationStep[] = [
  v2_1_0_backfill_onboarding_state,
  v2_1_0_backfill_training_state,
];
