import { PRESTIGE_TARGETS, type PrestigeCheckpointId } from '../balance/prestigeTargets.js';

export type CheckpointApHourInput = {
  checkpointId: PrestigeCheckpointId;
  apGain: number;
  elapsedSeconds: number;
};

export type CheckpointApHourResult = {
  checkpointId: PrestigeCheckpointId;
  apGain: number;
  elapsedSeconds: number;
  apPerHour: number;
  passes: boolean;
  reason: string;
};

export type ReclaimMilestoneTimes = {
  gate1Available: number;
  foundationEntry: number;
  coreReentry: number;
  nascentReentry?: number;
};

export type ReclaimScenarioReport = {
  scenarioId: keyof typeof PRESTIGE_TARGETS.reclaimMilestoneTargets;
  sourceCheckpoint: PrestigeCheckpointId;
  spendPlan: string[];
  reclaimSeconds: ReclaimMilestoneTimes;
  firstLifeBaselineSeconds: ReclaimMilestoneTimes;
  speedupRatio: Partial<Record<keyof ReclaimMilestoneTimes, number>>;
  passes: boolean;
};

const AP_HOUR_REASON_BY_CHECKPOINT: Record<PrestigeCheckpointId, string> = {
  foundation_entry: 'Pre-unlock checkpoint is informational only.',
  core_entry: 'Core viable AP/hour must meet the floor.',
  nascent_entry: 'Nascent AP/hour must improve over Core.',
  soul_entry: 'Soul AP/hour may plateau slightly but must not punish depth.',
  spirit_severing_entry: 'Cap AP/hour must remain the strongest long-run return.',
};

const toApPerHour = (apGain: number, elapsedSeconds: number): number => {
  if (!Number.isFinite(elapsedSeconds) || elapsedSeconds <= 0) return 0;
  return (Math.max(0, apGain) / elapsedSeconds) * 3600;
};

export function buildCheckpointApHourReport(inputs: CheckpointApHourInput[]): CheckpointApHourResult[] {
  const byId = Object.fromEntries(inputs.map((entry) => [entry.checkpointId, entry]));

  const core = toApPerHour(byId.core_entry?.apGain ?? 0, byId.core_entry?.elapsedSeconds ?? 0);
  const nascent = toApPerHour(byId.nascent_entry?.apGain ?? 0, byId.nascent_entry?.elapsedSeconds ?? 0);
  const soul = toApPerHour(byId.soul_entry?.apGain ?? 0, byId.soul_entry?.elapsedSeconds ?? 0);
  const cap = toApPerHour(byId.spirit_severing_entry?.apGain ?? 0, byId.spirit_severing_entry?.elapsedSeconds ?? 0);

  return inputs.map((entry) => {
    const apPerHour = toApPerHour(entry.apGain, entry.elapsedSeconds);
    let passes = true;

    if (entry.checkpointId === 'core_entry') {
      passes = apPerHour >= PRESTIGE_TARGETS.apPerHourPolicy.coreFormationApPerHourFloor;
    } else if (entry.checkpointId === 'nascent_entry') {
      passes = apPerHour >= core * PRESTIGE_TARGETS.apPerHourPolicy.nascentVsCoreMultiplierFloor;
    } else if (entry.checkpointId === 'soul_entry') {
      passes = apPerHour >= nascent * PRESTIGE_TARGETS.apPerHourPolicy.soulVsNascentMultiplierFloor;
    } else if (entry.checkpointId === 'spirit_severing_entry') {
      passes = apPerHour >= soul * PRESTIGE_TARGETS.apPerHourPolicy.capVsSoulMultiplierFloor;
    }

    return {
      checkpointId: entry.checkpointId,
      apGain: entry.apGain,
      elapsedSeconds: entry.elapsedSeconds,
      apPerHour,
      passes,
      reason: AP_HOUR_REASON_BY_CHECKPOINT[entry.checkpointId],
    };
  });
}

export function buildReclaimScenarioReport(args: {
  scenarioId: keyof typeof PRESTIGE_TARGETS.reclaimMilestoneTargets;
  sourceCheckpoint: PrestigeCheckpointId;
  spendPlan: string[];
  reclaimSeconds: ReclaimMilestoneTimes;
  firstLifeBaselineSeconds: ReclaimMilestoneTimes;
}): ReclaimScenarioReport {
  const speedupRatio: Partial<Record<keyof ReclaimMilestoneTimes, number>> = {};

  (Object.keys(args.reclaimSeconds) as Array<keyof ReclaimMilestoneTimes>).forEach((key) => {
    const reclaim = args.reclaimSeconds[key];
    const baseline = args.firstLifeBaselineSeconds[key];
    if (typeof reclaim !== 'number' || typeof baseline !== 'number' || baseline <= 0) return;
    speedupRatio[key] = 1 - reclaim / baseline;
  });

  const target = PRESTIGE_TARGETS.reclaimMilestoneTargets[args.scenarioId];
  const minutes = {
    gate1Available: args.reclaimSeconds.gate1Available / 60,
    foundationEntry: args.reclaimSeconds.foundationEntry / 60,
    coreReentry: args.reclaimSeconds.coreReentry / 60,
    nascentReentry: (args.reclaimSeconds.nascentReentry ?? 0) / 60,
  };

  let passes = true;
  if ('milestonesMinutes' in target) {
    passes = minutes.gate1Available >= target.milestonesMinutes.gate1Available.min
      && minutes.gate1Available <= target.milestonesMinutes.gate1Available.max
      && minutes.foundationEntry >= target.milestonesMinutes.foundationEntry.min
      && minutes.foundationEntry <= target.milestonesMinutes.foundationEntry.max
      && minutes.coreReentry >= target.milestonesMinutes.coreReentry.min
      && minutes.coreReentry <= target.milestonesMinutes.coreReentry.max
      && (!('nascentReentry' in target.milestonesMinutes)
        || (typeof minutes.nascentReentry === 'number'
          && minutes.nascentReentry >= target.milestonesMinutes.nascentReentry.min
          && minutes.nascentReentry <= target.milestonesMinutes.nascentReentry.max));
  }

  return {
    scenarioId: args.scenarioId,
    sourceCheckpoint: args.sourceCheckpoint,
    spendPlan: [...args.spendPlan],
    reclaimSeconds: args.reclaimSeconds,
    firstLifeBaselineSeconds: args.firstLifeBaselineSeconds,
    speedupRatio,
    passes,
  };
}

export function buildFirstPurchaseFeelReport(args: {
  noSpendSeconds: ReclaimMilestoneTimes;
  starterSpendSeconds: ReclaimMilestoneTimes;
}): {
  bestImprovement: number;
  gate1Improvement: number;
  foundationImprovement: number;
  passes: boolean;
} {
  const gate1Improvement = 1 - args.starterSpendSeconds.gate1Available / Math.max(1, args.noSpendSeconds.gate1Available);
  const foundationImprovement =
    1 - args.starterSpendSeconds.foundationEntry / Math.max(1, args.noSpendSeconds.foundationEntry);
  const bestImprovement = Math.max(gate1Improvement, foundationImprovement);
  return {
    bestImprovement,
    gate1Improvement,
    foundationImprovement,
    passes: bestImprovement >= PRESTIGE_TARGETS.reclaimMilestoneTargets.first_purchase_feel.minImprovementRatio,
  };
}
