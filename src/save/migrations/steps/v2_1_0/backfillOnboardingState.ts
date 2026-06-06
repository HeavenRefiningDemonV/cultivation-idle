import type { MigrationStep } from '../../migrationTypes.js';
import { CURRENT_SAVE_VERSION, compareSaveVersions } from '../../saveVersion.js';
import { sanitizeOnboardingState } from '../../../../stores/onboardingStore.js';
import { inferOnboardingStateFromSave } from '../../../../systems/onboarding/onboardingMigration.js';
import { ONBOARDING_SCHEMA_VERSION } from '../../../../systems/onboarding/onboardingTypes.js';
import { cloneSave, createStepResult, isRecord, touch, warning } from '../v2_0_0/shared.js';

const hasPreservableOnboardingState = (value: unknown): boolean =>
  isRecord(value)
  && value.schemaVersion === ONBOARDING_SCHEMA_VERSION
  && Array.isArray(value.completedMilestoneIds)
  && 'activeMilestoneId' in value;

const getRealmIndex = (save: Record<string, unknown>): number => {
  const gameState = isRecord(save.gameState) ? save.gameState : {};
  const realm = isRecord(gameState.realm) ? gameState.realm : {};
  return typeof realm.index === 'number' && Number.isFinite(realm.index) ? realm.index : 0;
};

export const v2_1_0_backfill_onboarding_state: MigrationStep = {
  id: 'v2_1_0_backfill_onboarding_state',
  title: 'Backfill first-life onboarding state',
  description: 'Infers durable onboarding milestone state for legacy saves before tab/module gating is introduced.',
  kind: 'transform',
  ownerPacket: 'onboarding-mp1',
  fromVersionRange: { maxExclusive: CURRENT_SAVE_VERSION },
  toVersion: CURRENT_SAVE_VERSION,
  priority: 95,
  appliesTo: (_save, ctx) => compareSaveVersions(ctx.sourceVersion, CURRENT_SAVE_VERSION) < 0,
  run: (save, ctx) => {
    const next = cloneSave(save);
    const warnings = [];
    const touched = [];
    const existing = next.onboardingState;

    if (hasPreservableOnboardingState(existing)) {
      const sanitized = sanitizeOnboardingState(existing);
      const advancedRealmNeedsInference =
        getRealmIndex(next) >= 1 &&
        (sanitized.activeMilestoneId !== 'complete' || sanitized.firstLifeOnlyComplete !== true);

      if (advancedRealmNeedsInference) {
        warnings.push(
          warning(
            'advanced-save-onboarding-reinferred',
            'Existing onboardingState would replay first-life gates for an advanced realm; inferred completed onboarding from save progress.',
            'onboarding-mp5',
            'warning',
            'onboardingState',
          ),
        );
        next.onboardingState = inferOnboardingStateFromSave({
          save: next,
          now: ctx.nowMs,
          migratedFromVersion: ctx.sourceVersion,
        });
        touched.push(touch('onboardingState', 'set', 'Re-inferred completed onboarding for advanced save.'));
        return createStepResult(
          v2_1_0_backfill_onboarding_state,
          next,
          'Re-inferred onboarding state for advanced save that still pointed at first-life tutorial gates.',
          { didMutate: true, warnings, touchedFieldPaths: touched },
        );
      }

      next.onboardingState = sanitized;
      touched.push(touch('onboardingState', 'preserve', 'Preserved existing onboarding state after sanitization.'));
      return createStepResult(
        v2_1_0_backfill_onboarding_state,
        next,
        'Preserved existing onboarding state for migrated save.',
        { didMutate: next.onboardingState !== existing, touchedFieldPaths: touched },
      );
    }

    if (existing !== undefined) {
      warnings.push(
        warning(
          'malformed-onboarding-state',
          'Existing onboardingState was malformed; inferred a safe replacement from save progress.',
          'onboarding-mp1',
          'warning',
          'onboardingState',
        ),
      );
    }

    next.onboardingState = inferOnboardingStateFromSave({
      save: next,
      now: ctx.nowMs,
      migratedFromVersion: ctx.sourceVersion,
    });
    touched.push(touch('onboardingState', 'set', 'Inferred first-life onboarding milestone state.'));

    return createStepResult(
      v2_1_0_backfill_onboarding_state,
      next,
      'Backfilled first-life onboarding state for migrated save.',
      { didMutate: true, warnings, touchedFieldPaths: touched },
    );
  },
};
