import type { MigrationStep } from '../../migrationTypes.js';
import { CURRENT_SAVE_VERSION } from '../../saveVersion.js';
import { cloneSave, createStepResult, isRecord, plan, touch, warning } from './shared.js';

export const v2_0_0_plan_offline_unification: MigrationStep = {
  id: 'v2_0_0_plan_offline_unification',
  title: 'Plan offline metadata unification',
  description: 'Detect split-brain offline metadata fields and report single-pipeline normalization plan for packet 1.8.',
  kind: 'reportOnly',
  ownerPacket: '1.8',
  fromVersionRange: { min: CURRENT_SAVE_VERSION },
  toVersion: CURRENT_SAVE_VERSION,
  priority: 85,
  appliesTo: (save) => isRecord(save.meta) || isRecord(save.gameState),
  run: (save) => {
    const next = cloneSave(save);
    const meta = isRecord(next.meta) ? next.meta : {};
    const gameState = isRecord(next.gameState) ? next.gameState : {};
    const values = {
      metaLastActiveAtMs: typeof meta.lastActiveAtMs === 'number' ? meta.lastActiveAtMs : null,
      gameLastActiveTime: typeof gameState.lastActiveTime === 'number' ? gameState.lastActiveTime : null,
      gameLastTickTime: typeof gameState.lastTickTime === 'number' ? gameState.lastTickTime : null,
    };

    const present = Object.entries(values).filter(([, value]) => value != null);
    const unique = new Set(present.map(([, value]) => value));
    const warnings = [];
    const touched = present.map(([key, value]) => touch(key, 'inspect', String(value)));
    const plannedMutations = [];

    if (present.length > 1 && unique.size > 1) {
      warnings.push(
        warning('OFFLINE_STATE_SPLIT_DETECTED', 'Multiple offline timestamp surfaces disagree in the same save.', '1.8', 'warning', 'meta.lastActiveAtMs'),
        warning('OFFLINE_NORMALIZATION_PLAN_READY', 'Offline metadata normalization plan is ready for packet 1.8.', '1.8', 'info', 'gameState.lastActiveTime'),
      );
      plannedMutations.push(
        plan('meta.lastActiveAtMs', '1.8', 'Choose one canonical offline timestamp source.'),
        plan('gameState.lastActiveTime', '1.8', 'Retire contradictory offline timestamp aliases if safe.', 'delete'),
      );
    }

    return createStepResult(
      v2_0_0_plan_offline_unification,
      next,
      plannedMutations.length > 0 ? 'Offline split-brain metadata detected; normalization plan recorded.' : 'Offline metadata already coherent.',
      { warnings, touchedFieldPaths: touched, plannedMutations },
    );
  },
};
