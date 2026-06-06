import assert from 'node:assert/strict';
import test from 'node:test';

import type { TrainingRuntimeContent, SaveTrainingState } from '../../src/systems/training/index.js';
import {
  buildPrestigeMemoryLedgerForReset,
  createDefaultPrestigeMemoryLedger,
} from '../../src/systems/prestige/prestigeMemory.js';

const trainingContent = {
  stats: [
    { id: 'qi_control', displayName: 'Qi Control', category: 'path', path: 'heaven', surfaces: [] },
    { id: 'mind_clarity', displayName: 'Mind Clarity', category: 'foundation', path: 'universal', surfaces: [] },
  ],
  regimens: [
    {
      id: 'still_star_breathing',
      path: 'heaven',
      displayName: 'Still Star Breathing',
      primaryStatId: 'qi_control',
      secondaryStatId: 'mind_clarity',
      foundationStatId: 'mind_clarity',
      regimenRate: 1,
      masteryMilestones: [100, 260, 520, 900],
      unlockRealmIndex: 0,
    },
  ],
  intensities: [],
  statsById: {},
  regimensById: {},
  intensitiesById: {},
  masteryMilestones: [100, 260, 520, 900],
} as unknown as TrainingRuntimeContent;

const trainingState: SaveTrainingState = {
  schemaVersion: 1,
  statRatingsById: { qi_control: 42, mind_clarity: 18 },
  statXpById: { qi_control: 99 },
  regimenMasteryXpById: { still_star_breathing: 620 },
  fatigue: 72,
  activeRegimenId: 'still_star_breathing',
  activeIntensityId: 'limit',
  lastTickAt: 123,
  lastOfflineSummary: null,
  prestigeMemoryAppliedForLife: false,
};

test('MP7 reset harvest stores component-keyed Reclaim records without raw reset-state carryover', () => {
  const ledger = buildPrestigeMemoryLedgerForReset({
    purchasesById: {
      form_memory: 1,
      scripture_echo: 1,
      root_clarity: 1,
      old_sparring_shadows: 1,
    },
    previousLedger: createDefaultPrestigeMemoryLedger(),
    trainingState,
    trainingContent,
    heartLawState: {
      selectedHeartLawId: 'heartlaw_ember_thread',
      heartLawLevelById: { heartlaw_ember_thread: 6 },
      heartLawXpById: { heartlaw_ember_thread: 320 },
      verseMasteryByLawId: { heartlaw_ember_thread: 80 },
      rootResonanceByPair: { 'fire::heartlaw_ember_thread': 61 },
    },
    selectedPath: 'heaven',
    realmIndex: 0,
    substageIndex: 0,
    spiritRoot: { grade: 3, element: 'fire', purity: 82 },
    currentCityId: 'city_pinewind_hamlet',
    trialProgressByTrialId: {
      trial_novices_clearing: {
        resolution: 'cleared',
        cleared: true,
        attempts: 1,
      },
    },
    trialContent: [{
      id: 'trial_novices_clearing',
      cityId: 'city_pinewind_hamlet',
      bossId: 'wolf_boss',
      gateItemId: 'gate_qi_condensation_1',
    }],
    prestigeCount: 1,
    now: 1000,
  });

  const domains = new Set(ledger.records.map((record) => record.domain));
  assert.equal(domains.has('path_training'), true);
  assert.equal(domains.has('heart_law'), true);
  assert.equal(domains.has('spirit_root'), true);
  assert.equal(domains.has('gate'), true);
  assert.equal(domains.has('composite_route'), true);
  assert.equal(ledger.records.every((record) => record.reclaimCaps.stopsAtPriorBest), true);
  assert.equal(ledger.lastResetBucketIds.includes('prestige_reclaim_component_memory'), true);
  assert.equal('statRatingsById' in (ledger as unknown as Record<string, unknown>), false);
  assert.equal('trialProgressByTrialId' in (ledger as unknown as Record<string, unknown>), false);
});
