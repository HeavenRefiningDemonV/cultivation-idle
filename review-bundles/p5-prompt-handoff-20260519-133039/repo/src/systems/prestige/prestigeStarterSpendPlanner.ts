import type { PrestigeUpgradeDef } from '../../content/types.js';
import { PRESTIGE_TARGETS } from '../balance/prestigeTargets.js';

export type PrestigeSpendCandidate = {
  id: string;
  name: string;
  nextCost: number;
  currentLevel: number;
  maxLevel: number;
  score: number;
  reasonLine: string;
};

export type PrestigeStarterSpendPlan = {
  topRecommendation: PrestigeSpendCandidate | null;
  orderedPlan: PrestigeSpendCandidate[];
  spentAp: number;
  remainingAp: number;
};

const DEFAULT_WEIGHT = 2;

const REASON_BY_ID: Record<string, string> = {
  ap_idle_qi_mult: 'Raises baseline Qi growth for faster reclaim pacing.',
  ap_combat_mult: 'Shortens combat gates and breakthrough pacing in reclaim runs.',
  ap_unlock_heartlaw_t1: 'Unlocks doctrine pivot power for next-life pacing.',
  ap_extra_technique_slot_1: 'Adds immediate build flexibility for reclaim throughput.',
  ap_mastery_retention_10: 'Keeps a bounded fraction of mastery progress after reset.',
  ap_mastery_retention_25: 'Keeps more mastery progress after reset.',
  ap_mastery_retention_50: 'Maximizes mastery carry-over after reset.',
  ap_offline_efficiency: 'Helpful for idle returns, lower priority for active reclaim.',
};

const getWeight = (upgradeId: string): number =>
  PRESTIGE_TARGETS.starterSpendCadencePolicy.reclaimScoreWeightsByUpgradeId[
    upgradeId as keyof typeof PRESTIGE_TARGETS.starterSpendCadencePolicy.reclaimScoreWeightsByUpgradeId
  ] ?? DEFAULT_WEIGHT;

const normalizeCost = (upgrade: PrestigeUpgradeDef, nextLevel: number): number | null => {
  if (nextLevel < 1 || nextLevel > upgrade.maxLevel) return null;
  const cost = upgrade.costs?.[nextLevel - 1];
  return typeof cost === 'number' && Number.isFinite(cost) && cost >= 0 ? cost : null;
};

const prereqsMet = (
  upgrade: PrestigeUpgradeDef,
  purchasedLevels: Record<string, number>,
): boolean => (upgrade.prereq ?? []).every((prereq) => (purchasedLevels[prereq.upgradeId] ?? 0) >= prereq.minLevel);

export function buildPrestigeStarterSpendPlan(args: {
  apBudget: number;
  purchasedLevels: Record<string, number>;
  visibleUpgrades: PrestigeUpgradeDef[];
}): PrestigeStarterSpendPlan {
  const visibleById = Object.fromEntries(args.visibleUpgrades.map((upgrade) => [upgrade.id, upgrade]));
  const planningLevels = { ...args.purchasedLevels };
  let remainingAp = Math.max(0, Math.floor(args.apBudget));

  const orderedPlan: PrestigeSpendCandidate[] = [];

  while (remainingAp > 0) {
    const candidates = args.visibleUpgrades
      .map((upgrade) => {
        const currentLevel = planningLevels[upgrade.id] ?? 0;
        if (currentLevel >= upgrade.maxLevel) return null;
        if (!prereqsMet(upgrade, planningLevels)) return null;
        const nextCost = normalizeCost(upgrade, currentLevel + 1);
        if (nextCost === null || nextCost > remainingAp) return null;
        const weight = getWeight(upgrade.id);
        const affordabilityFactor = Math.max(0.2, 1 - nextCost / Math.max(1, remainingAp));
        return {
          id: upgrade.id,
          name: upgrade.name,
          nextCost,
          currentLevel,
          maxLevel: upgrade.maxLevel,
          score: weight * 100 + affordabilityFactor * 10 - nextCost * 0.02,
          reasonLine: REASON_BY_ID[upgrade.id] ?? 'Improves reclaim pacing in next life.',
        } satisfies PrestigeSpendCandidate;
      })
      .filter((candidate): candidate is PrestigeSpendCandidate => candidate !== null)
      .sort((a, b) => b.score - a.score || a.nextCost - b.nextCost || a.id.localeCompare(b.id));

    if (candidates.length === 0) break;

    const next = candidates[0];
    orderedPlan.push(next);
    planningLevels[next.id] = (planningLevels[next.id] ?? 0) + 1;
    remainingAp -= next.nextCost;

    // Ensure no hidden/deferred nodes leak in through stale callers.
    if (!visibleById[next.id]) {
      orderedPlan.pop();
      break;
    }
  }

  return {
    topRecommendation: orderedPlan[0] ?? null,
    orderedPlan,
    spentAp: Math.max(0, Math.floor(args.apBudget) - remainingAp),
    remainingAp,
  };
}
