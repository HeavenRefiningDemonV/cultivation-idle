import assert from 'node:assert/strict';
import test from 'node:test';

import {
  buildCultivationExactSurfaceFromSnapshots,
} from '../../src/features/cultivation/exact/buildCultivationExactSurface.js';
import type { CultivationExactBuildSnapshot } from '../../src/features/cultivation/exact/cultivationExactTypes.js';

const baseSnapshot = {
  realm: { index: 0, substage: 7, name: 'Qi Condensation' },
  realmName: 'Qi Condensation',
  realmSubstages: 9,
  nextRealmName: 'Foundation Establishment',
  qi: '5500000',
  breakthroughRequirement: '24400000',
  qiPerSecond: '265.682',
  breathQiRateMultiplier: 1.1,
  breathModeLabel: 'Balanced',
  focusModeLabel: 'Balanced',
  activeActivityType: 'meditate',
  activeActivityLabel: 'Cultivating',
  stability: 0,
  stabilityCap: 100,
  selectedPathLabel: 'Heaven',
  selectedPathSummary: 'Heaven path doctrine.',
  spiritRootLabel: 'Fire / Rare',
  spiritRootDetail: 'Refined foundation',
  spiritRootElement: 'fire',
  heartLawName: 'Ember Thread Sutra',
  heartLawDetail: 'Fire sutra',
  heartLawTags: ['fire'],
  chapter: 1,
  comprehension: 2,
  comprehensionRequirement: 10,
  resonanceLine: 'Resonant',
  resonanceDetail: 'Aligned.',
  requiredGateItemId: null,
  requiredGateItemName: null,
  requiredGateItemCount: 0,
  atContentCap: false,
  canPrestige: false,
  activeBuffSummary: 'No active cultivation tonics.',
  runCompassActions: [],
} satisfies CultivationExactBuildSnapshot;

function build(overrides: Partial<CultivationExactBuildSnapshot>) {
  return buildCultivationExactSurfaceFromSnapshots({
    ...baseSnapshot,
    ...overrides,
  });
}

void test('Cultivation Exact live surface maps idle store truth without fixture copy', () => {
  const surface = build({
    activeActivityType: null,
    activeActivityLabel: 'Idle',
    qi: '1200',
    breakthroughRequirement: '10000',
    qiPerSecond: '25',
    breathQiRateMultiplier: 1,
    selectedPathLabel: 'No Path selected',
    spiritRootLabel: 'Dormant Spirit Root',
    spiritRootElement: 'neutral',
    heartLawName: 'No Heart Law selected',
    chapter: 3,
  });

  assert.equal(surface.meta.mode, 'live');
  assert.equal(surface.meta.source, 'stores');
  assert.equal(surface.meta.activityState, 'idle');
  assert.equal(surface.topRibbon.find((cell) => cell.id === 'qi')?.primary, '1.2K');
  assert.equal(surface.topRibbon.find((cell) => cell.id === 'foreground')?.primary, 'Idle');
  assert.equal(surface.rightDoctrineSeals.find((seal) => seal.id === 'path')?.value, 'No Path selected');
  assert.equal(surface.rightDoctrineSeals.find((seal) => seal.id === 'verse')?.value, 'Chapter 3');
  assert.equal(surface.commandDeck.primary.actionKey, 'startCultivation');
  assert.equal(surface.commandDeck.primary.label, 'Start Cultivation');
  assert.equal(surface.compactOmen?.currentOmen.kind, 'threshold_unreached');
  assert.equal(surface.compactOmen?.currentOmen.allowDirectRoute, false);
  assert.ok((surface.compactOmen?.proofSeals.length ?? 0) <= 3);
  assert.equal(surface.compactOmen?.proofSeals.some((seal) => seal.kind === 'qi_threshold'), true);
});

void test('Cultivation Exact live surface maps cultivating and near-edge states', () => {
  const cultivating = build({});
  assert.equal(cultivating.meta.activityState, 'cultivating');
  assert.equal(cultivating.commandDeck.primary.actionKey, 'stopCultivation');
  assert.equal(cultivating.commandDeck.primary.label, 'Stop Cultivation');
  assert.equal(cultivating.qiRail.combinedLabel, 'Qi 5.5M / 24.4M');
  assert.equal(cultivating.qiRail.rateLabel, '+292.25/s');

  const nearEdge = build({
    qi: '9200',
    breakthroughRequirement: '10000',
    activeActivityType: 'meditate',
  });
  assert.equal(nearEdge.meta.activityState, 'near_edge');
  assert.equal(nearEdge.qiRail.state, 'near_edge');
  assert.equal(nearEdge.breakthroughSeal.state, 'approaching_edge');
});

void test('Cultivation Exact live surface maps gate-blocked, ready, and content-cap states', () => {
  const gateBlocked = build({
    realm: { index: 0, substage: 9, name: 'Qi Condensation' },
    requiredGateItemId: 'token_gate',
    requiredGateItemName: 'Gate Proof',
    requiredGateItemCount: 0,
    qi: '30000000',
    breakthroughRequirement: '24400000',
    runCompassActions: [{
      id: 'gate',
      label: 'Challenge the Gate Trial',
      why: 'Gate proof is missing.',
      destinationLabel: 'Gate Trial',
      blocked: false,
      blockedReason: null,
      target: { kind: 'world_module', cityId: 'city_pinewind_hamlet', moduleKey: 'gateTrial' },
    }],
  });
  assert.equal(gateBlocked.meta.activityState, 'gate_blocked');
  assert.equal(gateBlocked.commandDeck.primary.actionKey, 'openGateTrial');
  assert.equal(gateBlocked.commandDeck.primary.label, 'Open Gate Trial');
  assert.equal(gateBlocked.leftMilestoneSeals[1]?.title, 'Gate Proof');
  assert.equal(gateBlocked.compactOmen?.currentOmen.kind, 'proof_missing');
  assert.equal(gateBlocked.compactOmen?.proofSeals.some((seal) => seal.kind === 'gate_proof' && seal.state === 'unsealed'), true);
  assert.equal(gateBlocked.compactOmen?.allowedDirectRoute?.target?.kind, 'world_module');

  const ready = build({
    realm: { index: 0, substage: 9, name: 'Qi Condensation' },
    requiredGateItemId: 'token_gate',
    requiredGateItemName: 'Gate Proof',
    requiredGateItemCount: 1,
    qi: '30000000',
    breakthroughRequirement: '24400000',
  });
  assert.equal(ready.meta.activityState, 'breakthrough_ready');
  assert.equal(ready.commandDeck.primary.actionKey, 'breakThrough');
  assert.equal(ready.commandDeck.primary.label, 'Break Through');
  assert.equal(ready.centerAltar.lotus.assetId, 'qi_lotus_full');
  assert.equal(ready.compactOmen?.currentOmen.kind, 'breakthrough_ready');
  assert.deepEqual(ready.compactOmen?.proofSeals.map((seal) => seal.kind), ['realm_edge', 'qi_threshold', 'gate_proof']);

  const substageReady = build({
    activeActivityType: null,
    activeActivityLabel: 'Idle',
    qi: '30000000',
    breakthroughRequirement: '24400000',
  });
  assert.equal(substageReady.meta.activityState, 'breakthrough_ready');
  assert.equal(substageReady.commandDeck.primary.actionKey, 'breakThrough');
  assert.equal(substageReady.commandDeck.primary.label, 'Break Through');
  assert.equal(substageReady.leftMilestoneSeals[2]?.title, 'Break Through');

  const contentCap = build({
    atContentCap: true,
    canPrestige: true,
    runCompassActions: [{
      id: 'prestige',
      label: 'Review Reincarnation',
      why: 'Content cap reached.',
      destinationLabel: 'Prestige',
      blocked: false,
      blockedReason: null,
      target: { kind: 'tab', tab: 'prestige' },
    }],
  });
  assert.equal(contentCap.meta.activityState, 'content_cap');
  assert.equal(contentCap.commandDeck.primary.actionKey, 'openPrestige');
  assert.equal(contentCap.leftMilestoneSeals[0]?.title, 'Chapter Cap');
  assert.equal(contentCap.lifeCycleWhisper.visible, false);
  assert.equal(contentCap.lifeCycleWhisper.active, false);
  assert.equal(contentCap.compactOmen?.currentOmen.kind, 'content_cap');
  assert.equal(contentCap.compactOmen?.proofSeals.some((seal) => seal.kind === 'reincarnation'), true);
});
