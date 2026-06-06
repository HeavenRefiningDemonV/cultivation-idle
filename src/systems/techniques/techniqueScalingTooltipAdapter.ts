import type { TechniqueDef } from '../../content/types.js';
import type { TrainingReadOnlySnapshot } from '../training/index.js';
import { resolveTechniqueScalingSnapshot } from './techniqueScalingResolver.js';

export interface TechniqueScalingTooltipRow {
  label: string;
  value: string;
  detail: string;
  combatEffectActive: boolean;
}

export interface BuildTechniqueScalingTooltipRowsInput {
  technique?: TechniqueDef | null;
  trainingSnapshot?: TrainingReadOnlySnapshot | null;
}

export function buildTechniqueScalingTooltipRows(
  input: BuildTechniqueScalingTooltipRowsInput = {},
): TechniqueScalingTooltipRow[] {
  const technique = input.technique;
  const snapshot = input.trainingSnapshot;
  if (!technique || !snapshot?.path || technique.path !== snapshot.path) {
    return [];
  }

  const scaling = resolveTechniqueScalingSnapshot({ technique, trainingSnapshot: snapshot });
  if (!scaling.combatEffectActive && scaling.contributions.length === 0) {
    return [];
  }

  return [{
    label: 'Training Hall',
    value: `Power ${scaling.totalMultiplier.toFixed(2)}x`,
    detail: scaling.contributions
      .filter((row) => row.id === 'primary' || row.id === 'secondary')
      .map((row) => `${row.label}: ${row.statId ?? 'n/a'} +${row.bonusPct.toFixed(1)}%`)
      .join(' · '),
    combatEffectActive: scaling.combatEffectActive,
  }];
}
