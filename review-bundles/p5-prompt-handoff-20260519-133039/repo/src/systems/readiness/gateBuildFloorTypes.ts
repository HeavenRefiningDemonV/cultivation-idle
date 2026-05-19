import type { AiProfile, CultivationPath } from '../../types/index.js';
import type { TrialId } from '../progression/contract/index.js';

/**
 * Each target means "at least `count` equipped techniques must be at least `level` mastery".
 *
 * These targets are independent checks, not mutually exclusive buckets.
 */
export interface GateBuildMasteryTarget {
  count: number;
  level: number;
}

/**
 * Build floor thresholds for a gate trial.
 *
 * - `activeSlotsFilled`: how many currently unlocked active slots should already be populated.
 * - `passiveSlotsFilled`: how many currently unlocked passive slots should already be populated.
 * - `ultimateRequired`: whether the current gate expects the ultimate slot to be unlocked and populated.
 * - `pathAlignmentScore`: packet-4.11 selected-path build-alignment threshold on a 0..100 scale.
 * - `masteryTargets`: independent mastery floor checks across the equipped build.
 * - `rankUpTotal`: aggregate rank-up steps above base rank 1 across the equipped build.
 * - `runeCount`: total applied runes across the equipped build, not rune inventory count.
 */
export interface GateBuildFloorThresholds {
  activeSlotsFilled: number;
  passiveSlotsFilled: number;
  ultimateRequired: boolean;
  pathAlignmentScore: number;
  masteryTargets: GateBuildMasteryTarget[];
  rankUpTotal: number;
  runeCount: number;
}

/**
 * Minimum threshold plus the conservative, path-specific AI posture expected for the trial.
 */
export interface GateBuildFloorMinimum extends GateBuildFloorThresholds {
  preferredAiByPath: Partial<Record<CultivationPath, AiProfile>>;
}

export interface GateBuildFloor {
  trialId: TrialId;
  minimum: GateBuildFloorMinimum;
  recommended: GateBuildFloorThresholds;
}
