import { REALMS } from '../../constants/index.js';

export type StageIndexInput = {
  realmIndex: number;
  /**
   * One-based realm substage from runtime save state.
   * Qi Condensation I is substage 1.
   */
  substage: number;
};

export const REALM_SUBSTAGE_COUNTS: readonly number[] = REALMS.map((realm) => realm.substages);

const floorFinite = (value: number, fallback: number): number =>
  Number.isFinite(value) ? Math.floor(value) : fallback;

const sumPriorSubstages = (realmIndex: number, counts: readonly number[]): number =>
  counts.slice(0, realmIndex).reduce((total, count) => total + Math.max(0, floorFinite(count, 0)), 0);

function assertCounts(counts: readonly number[]): void {
  if (counts.length === 0) {
    throw new Error('cultivation stage counts must not be empty');
  }
  counts.forEach((count, index) => {
    if (!Number.isInteger(count) || count <= 0) {
      throw new Error(`realm ${index} has invalid substage count ${String(count)}`);
    }
  });
}

function clampRealmIndex(realmIndex: number, counts: readonly number[]): number {
  return Math.max(0, Math.min(counts.length - 1, floorFinite(realmIndex, 0)));
}

function clampSubstage(substage: number, realmSubstageCount: number): number {
  return Math.max(1, Math.min(realmSubstageCount, floorFinite(substage, 1)));
}

/**
 * Zero-based internal cumulative cultivation stage index.
 * Qi Condensation I => 0; Spirit Severing VI => 44.
 */
export function getCanonicalCultivationStageIndex(
  input: StageIndexInput,
  counts: readonly number[] = REALM_SUBSTAGE_COUNTS,
): number {
  assertCounts(counts);
  const realmIndex = clampRealmIndex(input.realmIndex, counts);
  const substage = clampSubstage(input.substage, counts[realmIndex] ?? 1);
  return sumPriorSubstages(realmIndex, counts) + substage - 1;
}

/**
 * Strict zero-based internal cumulative stage index for authoring/content tests.
 * Runtime callers should prefer the clamped helper for old-save safety.
 */
export function getCanonicalCultivationStageIndexStrict(
  input: StageIndexInput,
  counts: readonly number[] = REALM_SUBSTAGE_COUNTS,
): number {
  assertCounts(counts);
  if (!Number.isInteger(input.realmIndex) || input.realmIndex < 0 || input.realmIndex >= counts.length) {
    throw new Error(`realmIndex ${String(input.realmIndex)} outside bounds 0-${counts.length - 1}`);
  }
  const realmSubstageCount = counts[input.realmIndex] ?? 1;
  if (!Number.isInteger(input.substage) || input.substage < 1 || input.substage > realmSubstageCount) {
    throw new Error(`substage ${String(input.substage)} outside realm ${input.realmIndex} bounds 1-${realmSubstageCount}`);
  }
  return sumPriorSubstages(input.realmIndex, counts) + input.substage - 1;
}

/**
 * One-based cumulative cultivation stage number for display and current
 * Heart Law "cultivationEffectiveStage" consumers.
 */
export function getCanonicalCultivationStageNumber(
  input: StageIndexInput,
  counts: readonly number[] = REALM_SUBSTAGE_COUNTS,
): number {
  return getCanonicalCultivationStageIndex(input, counts) + 1;
}
