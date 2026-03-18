import type { MigrationStep } from '../../migrationTypes.js';
import { CURRENT_SAVE_VERSION } from '../../saveVersion.js';
import { cloneSave, createStepResult, isRecord, plan, touch, warning } from './shared.js';

export const v2_0_0_plan_partial_reset_residue_cleanup: MigrationStep = {
  id: 'v2_0_0_plan_partial_reset_residue_cleanup',
  title: 'Plan partial prestige-reset residue cleanup',
  description: 'Detect obvious new-life contradictions across per-life stores and report cleanup plan for packet 1.7.',
  kind: 'plannedTransform',
  ownerPacket: '1.7',
  fromVersionRange: { min: CURRENT_SAVE_VERSION },
  toVersion: CURRENT_SAVE_VERSION,
  priority: 80,
  appliesTo: (save) => isRecord(save.gameState),
  run: (save) => {
    const next = cloneSave(save);
    const gameState = isRecord(next.gameState) ? next.gameState : {};
    const cityState = isRecord(next.cityState) ? next.cityState : {};
    const trialState = isRecord(next.trialState) ? next.trialState : {};
    const ruinsState = isRecord(next.ruinsState) ? next.ruinsState : {};
    const equipmentState = isRecord(next.equipmentState) ? next.equipmentState : {};
    const currentRealmIndex = isRecord(gameState.realm) && typeof gameState.realm.index === 'number' ? gameState.realm.index : 0;
    const unlockedCities = Array.isArray(cityState.unlockedCityIds) ? cityState.unlockedCityIds : [];
    const hasTrialProgress = isRecord(trialState.progressByTrialId) && Object.keys(trialState.progressByTrialId).length > 0;
    const hasRuinsProgress = isRecord(ruinsState.progressByRuinId) && Object.keys(ruinsState.progressByRuinId).length > 0;
    const hasEquippedGear = typeof equipmentState.equippedWeaponId === 'string' || typeof equipmentState.equippedAccessoryId === 'string';

    const warnings = [];
    const touched = [
      touch('gameState.realm.index', 'inspect', `Detected realm index ${currentRealmIndex}.`),
      touch('cityState.unlockedCityIds', 'inspect', `Unlocked cities ${unlockedCities.length}.`),
    ];
    const plannedMutations = [];

    if (currentRealmIndex === 0 && (unlockedCities.length > 1 || hasTrialProgress || hasRuinsProgress || hasEquippedGear)) {
      warnings.push(
        warning('PARTIAL_RESET_RESIDUE_DETECTED', 'Detected clean-life baseline with lingering per-life progression residue.', '1.7', 'warning', 'cityState.unlockedCityIds'),
        warning('CLEAN_NEW_LIFE_NORMALIZATION_PLAN_READY', 'Cleanup plan for partial-reset residue is ready for packet 1.7.', '1.7', 'info', 'trialState'),
      );
      if (unlockedCities.length > 1) plannedMutations.push(plan('cityState.unlockedCityIds', '1.7', 'Reset unlocked city list to clean-life baseline.'));
      if (hasTrialProgress) plannedMutations.push(plan('trialState.progressByTrialId', '1.7', 'Clear per-life trial residue.'));
      if (hasRuinsProgress) plannedMutations.push(plan('ruinsState.progressByRuinId', '1.7', 'Clear per-life ruins residue.'));
      if (hasEquippedGear) plannedMutations.push(plan('equipmentState', '1.7', 'Re-derive or clear incompatible equipment residue for a clean new life.'));
    }

    return createStepResult(
      v2_0_0_plan_partial_reset_residue_cleanup,
      next,
      plannedMutations.length > 0 ? 'Partial-reset residue cleanup plan recorded.' : 'No partial-reset residue detected.',
      { warnings, touchedFieldPaths: touched, plannedMutations },
    );
  },
};
