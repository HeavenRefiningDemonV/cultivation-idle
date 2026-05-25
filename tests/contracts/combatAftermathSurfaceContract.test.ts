import assert from 'node:assert/strict';
import test from 'node:test';

import {
  buildCombatAftermathSurfaceFromSnapshot,
  type CombatAftermathBuildSnapshot,
} from '../../src/features/combatAftermath/index.js';

const baseRunCompass = {
  version: 2,
  generatedAt: 100,
  mode: 'fixture',
  milestone: {
    id: 'breakthrough',
    label: 'Break through to Foundation Establishment',
    detail: 'Gate proof is resolved. Breakthrough is next.',
    state: 'breakthrough_pending',
    currentRealmLabel: 'Qi Condensation',
    nextRealmLabel: 'Foundation Establishment',
    contextLine: 'Foundation gate opened.',
  },
  primaryBlocker: {
    kind: 'none',
    label: 'Gate resolved',
    detail: 'Return to Cultivation.',
    severity: 'success',
    source: 'progression',
    confidence: 'high',
  },
  primaryRoute: {
    id: 'route-cultivation',
    label: 'Break through',
    actionLabel: 'Break Through',
    detail: 'Return to the sacred center and consume the gate proof.',
    destinationLabel: 'Cultivation',
    target: { kind: 'tab', tab: 'cultivation' },
    blocked: false,
    blockedReason: null,
    expectedDeltaLabel: 'Realm threshold opens.',
    source: 'progression',
    priority: 1,
  },
  secondaryRoutes: [],
  readiness: {
    score: 100,
    label: 'Ready',
    band: 'ready',
    diagnosisLabel: null,
    primaryShortfallLabel: null,
    rows: [],
  },
  currentCity: {
    cityId: 'city_pinewind_hamlet',
    cityName: 'Pinewind Hamlet',
    visibleModuleKeys: ['gateTrial'],
    recommendedModuleKey: 'gateTrial',
  },
  currentGate: {
    trialId: 'trial_novices_clearing',
    gateLabel: 'Foundation Gate',
    fromRealmLabel: 'Qi Condensation',
    toRealmLabel: 'Foundation Establishment',
    gateProofItemId: 'gate_foundation_pill',
    gateProofItemName: 'Gate Foundation Pill',
    lifecycleState: 'cleared',
    resolved: true,
    canAttempt: false,
    canBreakthrough: true,
    failSafeAvailable: false,
  },
  safetyNet: null,
  prestigeHint: null,
  recentDeltas: [],
  debugNotes: [],
} satisfies NonNullable<CombatAftermathBuildSnapshot['runCompass']>;

test('Gate Trial clear includes gate item and breakthrough route without mutating reward data', () => {
  const rewardResult = {
    appliedCurrencies: {},
    appliedItems: [{ itemId: 'gate_foundation_pill', qty: 1 }],
    droppedItems: [],
    appliedTechniqueFragments: [],
    appliedManuals: [],
    appliedComprehension: null,
    skippedRewards: [],
  };

  const surface = buildCombatAftermathSurfaceFromSnapshot({
    id: 'gate-clear',
    createdAt: 123,
    context: {
      kind: 'gate_trial',
      cityId: 'city_pinewind_hamlet',
      trialId: 'trial_novices_clearing',
      enemyName: 'Foundation Gate Guardian',
      gateLabel: 'Foundation Gate',
      gateProofItemId: 'gate_foundation_pill',
    },
    rewardResult,
    combatResolved: { outcome: 'victory', source: 'trial', trialId: 'trial_novices_clearing' },
    trialAttempt: { outcome: 'cleared', countsTowardFailSafe: true },
    runCompass: baseRunCompass,
    itemNamesById: { gate_foundation_pill: 'Gate Foundation Pill' },
  });

  assert.equal(surface.version, 1);
  assert.equal(surface.context.kind, 'gate_trial');
  assert.equal(surface.outcome.kind, 'cleared');
  assert.equal(surface.outcome.victoryGrade, 'breakthrough_worthy');
  assert.equal(surface.primaryRoute?.target?.kind, 'tab');
  assert.equal(surface.primaryRoute?.target && 'tab' in surface.primaryRoute.target ? surface.primaryRoute.target.tab : null, 'cultivation');
  assert.match(surface.memoryLine, /gate opened|proof/i);

  const gateProof = surface.spoilsGroups.find((group) => group.id === 'gate_proof');
  assert.ok(gateProof);
  assert.equal(gateProof.empty, false);
  assert.match(gateProof.summary, /Gate item/i);
  assert.equal(gateProof.lines[0]?.label, 'Gate Foundation Pill');

  assert.deepEqual(rewardResult.appliedItems, [{ itemId: 'gate_foundation_pill', qty: 1 }]);
});

test('Outskirts victory groups spendable gold and gate prep conservatively', () => {
  const surface = buildCombatAftermathSurfaceFromSnapshot({
    id: 'outskirts',
    createdAt: 200,
    context: { kind: 'outskirts', cityId: 'city_pinewind_hamlet', sourceId: 'outskirts_pinewind' },
    rewardResult: {
      appliedCurrencies: { gold: '300' },
      appliedItems: [{ itemId: 'mat_spirit_leaf', qty: 2 }],
      droppedItems: [],
      appliedTechniqueFragments: [],
      appliedManuals: [],
      appliedComprehension: null,
      skippedRewards: [],
    },
    combatResolved: { outcome: 'victory', source: 'outskirts' },
    runCompass: {
      ...baseRunCompass,
      currentGate: null,
      primaryRoute: {
        ...baseRunCompass.primaryRoute,
        id: 'route-apothecary',
        label: 'Stock medicine',
        destinationLabel: 'Apothecary',
        target: { kind: 'world_module', cityId: 'city_pinewind_hamlet', moduleKey: 'apothecary' },
        source: 'economy',
      },
    },
    itemNamesById: { mat_spirit_leaf: 'Spirit Leaf' },
  });

  assert.equal(surface.outcome.kind, 'victory');
  assert.equal(surface.spoilsGroups.find((group) => group.id === 'immediate_spend')?.empty, false);
  assert.equal(surface.spoilsGroups.find((group) => group.id === 'gate_prep')?.empty, false);
  assert.match(surface.economyDelta?.explanation ?? '', /prep|reserve|route/i);
  assert.equal(surface.primaryRoute?.target?.kind, 'world_module');
});

test('Gate Trial defeat maps diagnosis to one Mandate correction', () => {
  const surface = buildCombatAftermathSurfaceFromSnapshot({
    id: 'gate-defeat',
    createdAt: 300,
    context: { kind: 'gate_trial', trialId: 'trial_novices_clearing', gateLabel: 'Foundation Gate' },
    rewardResult: {
      appliedCurrencies: { merit: '5' },
      appliedItems: [],
      droppedItems: [],
      appliedTechniqueFragments: [],
      appliedManuals: [],
      appliedComprehension: null,
      skippedRewards: [],
    },
    combatResolved: { outcome: 'defeat', source: 'trial', trialId: 'trial_novices_clearing' },
    trialAttempt: { outcome: 'defeated', countsTowardFailSafe: true, eligibleFailCountAfterAttempt: 4 },
    diagnosis: {
      code: 'underprepared',
      label: 'Underprepared',
      explanation: 'The guardian exposed an underprepared pouch.',
      topFixLabel: 'Stock medicine pouch',
    },
    runCompass: {
      ...baseRunCompass,
      milestone: { ...baseRunCompass.milestone, state: 'gate_failed', label: 'Recover from gate rejection' },
      primaryBlocker: {
        ...baseRunCompass.primaryBlocker,
        kind: 'gate_recent_failure',
        label: 'Medicine floor remains short',
        detail: 'Stock the pouch before retrying.',
        severity: 'warning',
      },
      primaryRoute: {
        ...baseRunCompass.primaryRoute,
        id: 'route-apothecary',
        label: 'Stock medicine',
        destinationLabel: 'Apothecary',
        target: { kind: 'world_module', cityId: 'city_pinewind_hamlet', moduleKey: 'apothecary' },
        source: 'readiness',
      },
    },
  });

  assert.equal(surface.outcome.kind, 'defeat');
  assert.equal(surface.outcome.victoryGrade, 'not_applicable');
  assert.equal(surface.diagnosis?.code, 'underprepared');
  assert.equal(surface.diagnosis?.topFixRoute?.target?.kind, 'world_module');
  assert.equal(surface.secondaryRoutes.length <= 3, true);
  assert.doesNotMatch(JSON.stringify(surface), /Stay the course|Waiting/);
});

test('Safety Net bypass is distinct from clean clear but still routes to breakthrough', () => {
  const surface = buildCombatAftermathSurfaceFromSnapshot({
    id: 'gate-bypass',
    createdAt: 400,
    context: {
      kind: 'gate_trial',
      trialId: 'trial_novices_clearing',
      gateLabel: 'Foundation Gate',
      gateProofItemId: 'gate_foundation_pill',
    },
    rewardResult: {
      appliedCurrencies: {},
      appliedItems: [{ itemId: 'gate_foundation_pill', qty: 1 }],
      droppedItems: [],
      appliedTechniqueFragments: [],
      appliedManuals: [],
      appliedComprehension: null,
      skippedRewards: [],
    },
    trialAttempt: { outcome: 'bypassed', countsTowardFailSafe: true },
    runCompass: baseRunCompass,
    itemNamesById: { gate_foundation_pill: 'Gate Foundation Pill' },
  });

  assert.equal(surface.outcome.kind, 'bypassed');
  assert.match(surface.outcome.subtitle, /Safety Net|fallback/i);
  assert.equal(surface.outcome.victoryGrade, 'breakthrough_worthy');
  assert.equal(surface.primaryRoute?.target?.kind, 'tab');
});

test('victory grading does not treat duration as HP remaining', () => {
  const surface = buildCombatAftermathSurfaceFromSnapshot({
    id: 'ruins-duration-only',
    createdAt: 500,
    context: { kind: 'ruins', cityId: 'city_pinewind_hamlet', ruinId: 'ruin_pinewind_hollow' },
    rewardResult: {
      appliedCurrencies: { gold: '80' },
      appliedItems: [],
      droppedItems: [],
      appliedTechniqueFragments: [],
      appliedManuals: [],
      appliedComprehension: null,
      skippedRewards: [],
    },
    combatResolved: { outcome: 'victory', source: 'ruins', durationSec: 180 },
    runCompass: baseRunCompass,
  });

  assert.equal(surface.outcome.kind, 'support_complete');
  assert.equal(surface.outcome.victoryGrade, 'unknown');
  assert.match(surface.outcome.gradeReason, /survival|HP|medicine|unavailable/i);
  assert.ok(surface.debugNotes.some((note) => /survival|HP|medicine/i.test(note)));
});
