import { buildPrestigeProgressionSnapshot, calculatePrestigeApForecast } from '../../../src/systems/prestige/prestigeApReadModel.js';
import type { PrestigeCheckpointId } from '../../../src/systems/balance/prestigeTargets.js';
import { buildCheckpointApHourReport } from '../../../src/systems/prestige/prestigeReclaimReadModel.js';
import { PROGRESSION_MILESTONE_IDS } from '../../../src/systems/balance/phaseTimingTargets.js';
import { createPrestigeProbeScenario } from './createPrestigeProbeScenario.js';

export async function runPrestigeApHourProbe() {
  const scenario = await createPrestigeProbeScenario();
  const milestones = scenario.phaseProbe.cumulativeMilestoneSeconds;

  const checkpointInputs: Array<{ checkpointId: PrestigeCheckpointId; highestRealmIndex: number; elapsedSeconds: number; resolvedGateCount: number }> = [
    {
      checkpointId: 'core_entry',
      highestRealmIndex: 2,
      elapsedSeconds: milestones[PROGRESSION_MILESTONE_IDS.CORE_FORMATION_ENTRY] ?? 0,
      resolvedGateCount: 1,
    },
    {
      checkpointId: 'nascent_entry',
      highestRealmIndex: 3,
      elapsedSeconds: milestones[PROGRESSION_MILESTONE_IDS.NASCENT_SOUL_ENTRY] ?? 0,
      resolvedGateCount: 2,
    },
    {
      checkpointId: 'soul_entry',
      highestRealmIndex: 4,
      elapsedSeconds: milestones[PROGRESSION_MILESTONE_IDS.SOUL_FORMATION_ENTRY] ?? 0,
      resolvedGateCount: 3,
    },
    {
      checkpointId: 'spirit_severing_entry',
      highestRealmIndex: 5,
      elapsedSeconds: milestones[PROGRESSION_MILESTONE_IDS.SPIRIT_SEVERING_ENTRY] ?? 0,
      resolvedGateCount: 4,
    },
  ];

  const apHourRows = checkpointInputs.map((entry) => {
    const forecast = calculatePrestigeApForecast(buildPrestigeProgressionSnapshot({
      currentRealmIndex: entry.highestRealmIndex,
      currentSubstage: 1,
      highestRealmReached: entry.highestRealmIndex,
      resolvedGateCount: entry.resolvedGateCount,
    }));
    return {
      checkpointId: entry.checkpointId,
      apGain: forecast.totalAp,
      elapsedSeconds: entry.elapsedSeconds,
    };
  });

  return {
    phaseProbe: scenario.phaseProbe,
    rows: buildCheckpointApHourReport(apHourRows),
  };
}
