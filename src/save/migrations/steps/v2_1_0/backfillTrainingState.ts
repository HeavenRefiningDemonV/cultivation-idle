import type { MigrationStep } from '../../migrationTypes.js';
import { CURRENT_SAVE_VERSION, compareSaveVersions } from '../../saveVersion.js';
import {
  createDefaultTrainingSaveState,
  sanitizeTrainingSaveState,
} from '../../../../systems/training/index.js';
import { cloneSave, createStepResult, isRecord, touch, warning } from '../v2_0_0/shared.js';

const hasPreservableTrainingState = (value: unknown): boolean =>
  isRecord(value)
  && value.schemaVersion === 1
  && isRecord(value.statRatingsById)
  && isRecord(value.statXpById)
  && isRecord(value.regimenMasteryXpById);

export const v2_1_0_backfill_training_state: MigrationStep = {
  id: 'v2_1_0_backfill_training_state',
  title: 'Backfill Training Hall runtime state',
  description: 'Adds the MP1 Training Hall runtime save slice and sanitizes malformed active practice state.',
  kind: 'transform',
  ownerPacket: 'training-heart-law-mp1',
  fromVersionRange: { maxExclusive: CURRENT_SAVE_VERSION },
  toVersion: CURRENT_SAVE_VERSION,
  priority: 96,
  appliesTo: (save, ctx) =>
    compareSaveVersions(ctx.sourceVersion, CURRENT_SAVE_VERSION) < 0 || !hasPreservableTrainingState(save.trainingState),
  run: (save) => {
    const next = cloneSave(save);
    const warnings = [];
    const touched = [];
    const existing = next.trainingState;

    if (hasPreservableTrainingState(existing)) {
      next.trainingState = sanitizeTrainingSaveState(existing);
      touched.push(touch('trainingState', 'preserve', 'Preserved and sanitized existing Training Hall state.'));
      return createStepResult(
        v2_1_0_backfill_training_state,
        next,
        'Preserved existing Training Hall runtime state.',
        { didMutate: next.trainingState !== existing, touchedFieldPaths: touched },
      );
    }

    if (existing !== undefined) {
      warnings.push(
        warning(
          'malformed-training-state',
          'Existing trainingState was malformed; replaced with a safe empty Training Hall runtime state.',
          'training-heart-law-mp1',
          'warning',
          'trainingState',
        ),
      );
    }

    next.trainingState = createDefaultTrainingSaveState();
    touched.push(touch('trainingState', 'set', 'Backfilled empty Training Hall runtime state.'));

    return createStepResult(
      v2_1_0_backfill_training_state,
      next,
      'Backfilled Training Hall runtime state.',
      { didMutate: true, warnings, touchedFieldPaths: touched },
    );
  },
};
