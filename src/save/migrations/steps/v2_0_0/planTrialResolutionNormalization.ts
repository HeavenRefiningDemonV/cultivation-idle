import type { MigrationStep } from '../../migrationTypes.js';
import { CURRENT_SAVE_VERSION } from '../../saveVersion.js';
import { cloneSave, createStepResult, isRecord, plan, touch, warning } from './shared.js';

const FIRST_TRIAL_ID = 'trial_novices_clearing';
const FIRST_GATE_IDS = ['gate_foundation_pill', 'foundation_pill'];

export const v2_0_0_plan_trial_resolution_normalization: MigrationStep = {
  id: 'v2_0_0_plan_trial_resolution_normalization',
  title: 'Plan trial/gate resolution normalization',
  description: 'Detect realm progression that contradicts gate/trial proof and report normalization plan for packets 1.4/1.5.',
  kind: 'plannedTransform',
  ownerPacket: '1.4/1.5',
  fromVersionRange: { min: CURRENT_SAVE_VERSION },
  toVersion: CURRENT_SAVE_VERSION,
  priority: 70,
  appliesTo: (save) => isRecord(save.gameState),
  run: (save) => {
    const next = cloneSave(save);
    const gameState = isRecord(next.gameState) ? next.gameState : {};
    const trialState = isRecord(next.trialState) ? next.trialState : {};
    const inventoryState = isRecord(next.inventoryState) ? next.inventoryState : {};
    const items = isRecord(inventoryState.items) ? (inventoryState.items as Record<string, unknown>) : {};
    const progressByTrialId = isRecord(trialState.progressByTrialId) ? (trialState.progressByTrialId as Record<string, unknown>) : {};
    const firstTrialProgress = isRecord(progressByTrialId[FIRST_TRIAL_ID]) ? (progressByTrialId[FIRST_TRIAL_ID] as Record<string, unknown>) : null;
    const currentRealmIndex = isRecord(gameState.realm) && typeof gameState.realm.index === 'number' ? gameState.realm.index : 0;
    const hasFirstGateProof = FIRST_GATE_IDS.some((itemId) => typeof items[itemId] === 'number' && (items[itemId] as number) > 0);
    const firstTrialCleared = typeof firstTrialProgress?.cleared === 'boolean' ? firstTrialProgress.cleared : false;

    const warnings = [];
    const touched = [
      touch('gameState.realm.index', 'inspect', `Detected realm index ${currentRealmIndex}.`),
      touch(`trialState.progressByTrialId.${FIRST_TRIAL_ID}`, 'inspect', `Cleared=${String(firstTrialCleared)}.`),
    ];
    const plannedMutations = [];

    if (currentRealmIndex >= 1 && !firstTrialCleared && !hasFirstGateProof) {
      warnings.push(
        warning('TRIAL_RESOLUTION_MISMATCH', 'Realm progress indicates Foundation-or-better, but first trial clear and gate proof are both missing.', '1.4', 'warning', 'trialState.progressByTrialId'),
        warning('LEGACY_PROGRESS_WITHOUT_GATE_PROOF', 'Legacy progression appears ahead of gate proof state.', '1.5', 'warning', 'inventoryState.items'),
        warning('GATE_STATE_NORMALIZATION_PLAN_READY', 'Gate/trial normalization plan is ready for packets 1.4/1.5.', '1.4', 'info', 'trialState.progressByTrialId'),
      );
      plannedMutations.push(
        plan(`trialState.progressByTrialId.${FIRST_TRIAL_ID}.cleared`, '1.4', 'Derive gate resolution from already-advanced realm state if validated.'),
        plan('inventoryState.items.gate_foundation_pill', '1.5', 'Normalize gate proof/evidence relative to advancement state.'),
      );
    }

    return createStepResult(
      v2_0_0_plan_trial_resolution_normalization,
      next,
      plannedMutations.length > 0 ? 'Trial/gate normalization plan prepared from contradictory progression state.' : 'No trial/gate mismatch detected.',
      { warnings, touchedFieldPaths: touched, plannedMutations },
    );
  },
};
