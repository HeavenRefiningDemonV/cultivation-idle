import assert from 'node:assert/strict';
import test from 'node:test';

import type { TrainingRuntimeContent, SaveTrainingState } from '../../src/systems/training/index.js';
import {
  applyFormMemoryTrainingFloor,
  applyScriptureEchoToHeartLawState,
  buildPrestigeMemoryLedgerForReset,
  createDefaultPrestigeMemoryLedger,
  resolveCalmFirstBreathRiskReduction,
  resolveOldSparringMasteryMultiplier,
  resolvePrestigeMemoryEffects,
  clampSpiritRootWithRootClarity,
} from '../../src/systems/prestige/prestigeMemory.js';

const trainingContent = {
  stats: [
    { id: 'qi_control', displayName: 'Qi Control', category: 'path', path: 'heaven', surfaces: [] },
    { id: 'mind_clarity', displayName: 'Mind Clarity', category: 'foundation', path: 'universal', surfaces: [] },
    { id: 'weapon_intent', displayName: 'Weapon Intent', category: 'path', path: 'martial', surfaces: [] },
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
    {
      id: 'thousand_cut_form',
      path: 'martial',
      displayName: 'Thousand-Cut Form',
      primaryStatId: 'weapon_intent',
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

const baseTrainingState = (): SaveTrainingState => ({
  schemaVersion: 1,
  statRatingsById: { qi_control: 1, mind_clarity: 3, weapon_intent: 2 },
  statXpById: { qi_control: 99 },
  regimenMasteryXpById: { still_star_breathing: 620 },
  fatigue: 72,
  activeRegimenId: 'still_star_breathing',
  activeIntensityId: 'limit',
  lastTickAt: 123,
  lastOfflineSummary: null,
  prestigeMemoryAppliedForLife: false,
});

test('MP5 prestige memory rank table resolves the numeric lockdown values', () => {
  const effects = resolvePrestigeMemoryEffects({
    form_memory: 3,
    scripture_echo: 3,
    root_clarity: 3,
    calm_first_breath: 3,
    old_sparring_shadows: 2,
    doctrine_archive: 1,
  });

  assert.equal(effects.formMemoryFloor, 12);
  assert.equal(effects.scriptureVerseRetentionPct, 0.4);
  assert.equal(effects.scriptureXpCatchupMultiplier, 0.3);
  assert.equal(effects.rootClarityGradeFloor, 3);
  assert.equal(effects.calmFirstBreathRiskReduction, 3);
  assert.equal(effects.oldSparringMasteryCatchupMultiplier, 0.35);
  assert.equal(effects.doctrineArchiveRuntime, 'hidden_unsupported');
});

test('prestige memory ledger stores bounded milestones and echoes, not raw life state', () => {
  const ledger = buildPrestigeMemoryLedgerForReset({
    purchasesById: { scripture_echo: 2, old_sparring_shadows: 2 },
    previousLedger: createDefaultPrestigeMemoryLedger(),
    trainingState: baseTrainingState(),
    trainingContent,
    heartLawState: {
      selectedHeartLawId: 'heartlaw_flame',
      verseMasteryByLawId: { heartlaw_flame: 80 },
    },
    now: 1000,
  });

  assert.deepEqual(ledger.previousRegimenMasteryMilestonesById, { still_star_breathing: 520 });
  assert.deepEqual(ledger.scriptureEchoByLawId, { heartlaw_flame: 20 });
  assert.equal('statRatingsById' in (ledger as unknown as Record<string, unknown>), false);
  assert.equal('fatigue' in (ledger as unknown as Record<string, unknown>), false);
  assert.equal(ledger.lastAppliedRows.some((row) => row.effectId === 'scripture_echo'), true);
});

test('Form Memory applies only a path stat floor within the current realm cap', () => {
  const next = applyFormMemoryTrainingFloor({
    state: baseTrainingState(),
    content: trainingContent,
    selectedPath: 'heaven',
    realmIndex: 0,
    substageIndex: 0,
    purchasesById: { form_memory: 2 },
  });

  assert.equal(next.statRatingsById.qi_control, 8);
  assert.equal(next.statRatingsById.mind_clarity, 8);
  assert.equal(next.statRatingsById.weapon_intent, 2);
  assert.deepEqual(next.statXpById, {});
  assert.equal(next.fatigue, 0);
  assert.equal(next.activeRegimenId, null);
});

test('Scripture Echo, Calm First Breath, Root Clarity, and Old Sparring are bounded effects', () => {
  const heartLaw = applyScriptureEchoToHeartLawState({
    state: {
      selectedHeartLawId: 'heartlaw_flame',
      heartLawLevelById: {},
      heartLawXpById: {},
      verseMasteryByLawId: {},
    },
    ledger: {
      ...createDefaultPrestigeMemoryLedger(),
      scriptureEchoByLawId: { heartlaw_flame: 32 },
    },
    selectedHeartLawId: 'heartlaw_flame',
    purchasesById: { scripture_echo: 3 },
  });

  assert.equal(heartLaw.verseMasteryByLawId.heartlaw_flame, 32);
  assert.equal(resolveCalmFirstBreathRiskReduction({
    purchasesById: { calm_first_breath: 3 },
    heartLawStage: 4,
    cultivationEffectiveStage: 4,
  }), 3);
  assert.equal(resolveCalmFirstBreathRiskReduction({
    purchasesById: { calm_first_breath: 3 },
    heartLawStage: 2,
    cultivationEffectiveStage: 4,
  }), 0);
  assert.deepEqual(
    clampSpiritRootWithRootClarity({ grade: 1, element: 'fire', purity: 44 }, { root_clarity: 2 }),
    { grade: 3, element: 'fire', purity: 44 },
  );
  assert.equal(resolveOldSparringMasteryMultiplier({
    purchasesById: { old_sparring_shadows: 2 },
    currentMasteryXp: 519,
    previousMilestoneXp: 520,
  }), 1.35);
  assert.equal(resolveOldSparringMasteryMultiplier({
    purchasesById: { old_sparring_shadows: 2 },
    currentMasteryXp: 520,
    previousMilestoneXp: 520,
  }), 1);
});
