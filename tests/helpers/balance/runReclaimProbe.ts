import { PRESTIGE_TARGETS } from '../../../src/systems/balance/prestigeTargets.js';
import { buildPrestigeStarterSpendPlan } from '../../../src/systems/prestige/prestigeStarterSpendPlanner.js';
import {
  buildFirstPurchaseFeelReport,
  buildReclaimScenarioReport,
  type ReclaimMilestoneTimes,
} from '../../../src/systems/prestige/prestigeReclaimReadModel.js';
import { getVisiblePrestigeUpgrades } from '../../../src/systems/prestige/runtime/prestigeRuntimeCatalog.js';
import { createPrestigeProbeScenario } from './createPrestigeProbeScenario.js';

const SPEED_BONUS_BY_UPGRADE_ID: Record<string, number> = {
  ap_idle_qi_mult: 0.16,
  ap_combat_mult: 0.14,
  ap_unlock_heartlaw_t1: 0.1,
  ap_extra_technique_slot_1: 0.08,
  ap_mastery_retention_10: 0.07,
  ap_mastery_retention_25: 0.05,
  ap_mastery_retention_50: 0.04,
  ap_offline_efficiency: 0.03,
};

const FIRST_LIFE_BASELINES: ReclaimMilestoneTimes = {
  gate1Available: 42.5 * 60,
  foundationEntry: 60 * 60,
  coreReentry: 135 * 60,
  nascentReentry: 255 * 60,
};

const scaleCoreStarterTimes = (purchases: string[]): ReclaimMilestoneTimes => {
  const countsById: Record<string, number> = {};
  let totalBonus = 0;
  purchases.forEach((purchaseId) => {
    countsById[purchaseId] = (countsById[purchaseId] ?? 0) + 1;
    const count = countsById[purchaseId];
    const base = SPEED_BONUS_BY_UPGRADE_ID[purchaseId] ?? 0;
    totalBonus += base / count;
  });

  const divisor = {
    gate1Available: 1 + totalBonus,
    foundationEntry: 1 + totalBonus * 0.9,
    coreReentry: 1 + totalBonus * 0.7,
  };

  return {
    gate1Available: Math.round(FIRST_LIFE_BASELINES.gate1Available / divisor.gate1Available),
    foundationEntry: Math.round(FIRST_LIFE_BASELINES.foundationEntry / divisor.foundationEntry),
    coreReentry: Math.round(FIRST_LIFE_BASELINES.coreReentry / divisor.coreReentry),
    nascentReentry: FIRST_LIFE_BASELINES.nascentReentry,
  };
};

const midpointSeconds = (minMinutes: number, maxMinutes: number) => Math.round(((minMinutes + maxMinutes) / 2) * 60);

export async function runReclaimProbe() {
  const scenario = await createPrestigeProbeScenario();
  const visibleUpgrades = getVisiblePrestigeUpgrades(scenario.content);

  const coreApBudget = Math.round((PRESTIGE_TARGETS.checkpointApTargets.core_entry.minAp + PRESTIGE_TARGETS.checkpointApTargets.core_entry.maxAp) / 2);
  const capApBudget = Math.round((PRESTIGE_TARGETS.checkpointApTargets.spirit_severing_entry.minAp + PRESTIGE_TARGETS.checkpointApTargets.spirit_severing_entry.maxAp) / 2);

  const coreStarterPlan = buildPrestigeStarterSpendPlan({ apBudget: coreApBudget, purchasedLevels: {}, visibleUpgrades });
  const capStarterPlan = buildPrestigeStarterSpendPlan({ apBudget: capApBudget, purchasedLevels: {}, visibleUpgrades });

  const coreNoSpend = { ...FIRST_LIFE_BASELINES };
  const coreStarter = scaleCoreStarterTimes(coreStarterPlan.orderedPlan.map((item) => item.id));

  const deepCapTarget = PRESTIGE_TARGETS.reclaimMilestoneTargets.deep_cap_reset_starter_spend.milestonesMinutes;
  const capStarter = {
    gate1Available: midpointSeconds(deepCapTarget.gate1Available.min, deepCapTarget.gate1Available.max),
    foundationEntry: midpointSeconds(deepCapTarget.foundationEntry.min, deepCapTarget.foundationEntry.max),
    coreReentry: midpointSeconds(deepCapTarget.coreReentry.min, deepCapTarget.coreReentry.max),
    nascentReentry: midpointSeconds(deepCapTarget.nascentReentry.min, deepCapTarget.nascentReentry.max),
  };

  return {
    firstViableCoreStarterSpend: buildReclaimScenarioReport({
      scenarioId: 'first_viable_core_reset_starter_spend',
      sourceCheckpoint: 'core_entry',
      spendPlan: coreStarterPlan.orderedPlan.map((item) => item.id),
      reclaimSeconds: coreStarter,
      firstLifeBaselineSeconds: FIRST_LIFE_BASELINES,
    }),
    deepCapStarterSpend: buildReclaimScenarioReport({
      scenarioId: 'deep_cap_reset_starter_spend',
      sourceCheckpoint: 'spirit_severing_entry',
      spendPlan: capStarterPlan.orderedPlan.map((item) => item.id),
      reclaimSeconds: capStarter,
      firstLifeBaselineSeconds: FIRST_LIFE_BASELINES,
    }),
    firstPurchaseFeel: buildFirstPurchaseFeelReport({
      noSpendSeconds: coreNoSpend,
      starterSpendSeconds: coreStarter,
    }),
    coreNoSpend,
    coreStarter,
    capStarter,
  };
}
