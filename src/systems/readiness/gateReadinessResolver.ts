import type { ReadinessCategoryDef } from '../../content/types.js';
import type { TrainingReadOnlySnapshot } from '../training/index.js';

export interface GateReadinessRow {
  categoryId: string;
  score: number;
  maxScore: number;
  label: string;
  debug: { mode: 'stub_no_gameplay_effect' | 'read_only_training_snapshot' };
}

export interface ResolveGateReadinessRowsOptions {
  trainingSnapshot?: TrainingReadOnlySnapshot | null;
}

function clampScore(value: number, maxScore: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(maxScore, Math.round(value)));
}

function pathTrainingScore(snapshot: TrainingReadOnlySnapshot, maxScore: number): number {
  if (!snapshot.path) return 0;
  const foundation = snapshot.pathFoundation.progressPct / 100;
  const mastery = snapshot.regimensForPath.length > 0
    ? snapshot.regimensForPath.reduce((sum, regimen) => sum + regimen.masteryPct, 0) / (snapshot.regimensForPath.length * 100)
    : 0;
  return clampScore((foundation * 0.8 + mastery * 0.2) * maxScore, maxScore);
}

export function resolveGateReadinessRows(
  categories: readonly ReadinessCategoryDef[] = [],
  options: ResolveGateReadinessRowsOptions = {},
): GateReadinessRow[] {
  return categories.map((category) => ({
    categoryId: category.id,
    score: category.id === 'path_training' && options.trainingSnapshot
      ? pathTrainingScore(options.trainingSnapshot, category.maxScore)
      : 0,
    maxScore: category.maxScore,
    label: category.displayName,
    debug: { mode: category.id === 'path_training' && options.trainingSnapshot ? 'read_only_training_snapshot' : 'stub_no_gameplay_effect' },
  }));
}
