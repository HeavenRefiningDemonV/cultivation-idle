import assert from 'node:assert/strict';
import test from 'node:test';

import { buildCultivationExactSurfaceFromSnapshots } from '../../src/features/cultivation/exact/buildCultivationExactSurface.js';
import type { CultivationExactBuildSnapshot } from '../../src/features/cultivation/exact/cultivationExactTypes.js';
import { MAX_OFFLINE_HOURS } from '../../src/services/time/offlineShared.js';

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
  return buildCultivationExactSurfaceFromSnapshots({ ...baseSnapshot, ...overrides });
}

void test('M.II.1-§F — idle accrual reads the offline cap, foreground mode, and on-return accrual', () => {
  const surface = build({
    foregroundMode: 'cultivation',
    accruedWhileAwayLabel: '12.4M Qi while away',
    offlineEfficiencyLabel: '50% offline efficiency',
  });
  assert.equal(surface.idleAccrual.foregroundMode, 'cultivation');
  assert.equal(surface.idleAccrual.isPreemptedByCombat, false);
  assert.equal(surface.idleAccrual.offlineCapHours, MAX_OFFLINE_HOURS);
  assert.ok(MAX_OFFLINE_HOURS > 0, 'a finite offline cap is published');
  assert.equal(surface.idleAccrual.accruedWhileAwayLabel, '12.4M Qi while away');
  assert.match(surface.idleAccrual.ratePerSecondLabel, /Qi\/s$/);
});

void test('M.II.1-§F — combat preempts idle accrual; other foreground modes remain offline-eligible', () => {
  assert.equal(build({ foregroundMode: 'combat' }).idleAccrual.isPreemptedByCombat, true);
  assert.equal(build({ foregroundMode: 'path_training' }).idleAccrual.isPreemptedByCombat, false);
  assert.equal(build({ foregroundMode: 'queued_only' }).idleAccrual.isPreemptedByCombat, false);
  // no offline-return ⇒ the "what your absence earned" line is null
  assert.equal(build({}).idleAccrual.accruedWhileAwayLabel, null);
});

void test('M.II.1 — breakthrough readiness exposes the live-stat-fed proof, never-regress, pity, and gate state', () => {
  const surface = build({
    gateTrialState: 'available',
    pity: { eligibleFailures: 2, threshold: 3, guaranteedClearReady: false },
  });
  assert.equal(surface.breakthroughReadiness.riskInputsLiveStatFed, true);
  assert.equal(surface.breakthroughReadiness.neverRegress.guaranteed, true);
  assert.match(surface.breakthroughReadiness.neverRegress.explanation, /never lowers/i);
  assert.equal(surface.breakthroughReadiness.gateTrialState, 'available');
  assert.equal(surface.breakthroughReadiness.pity.eligibleFailures, 2);
  assert.equal(surface.breakthroughReadiness.pity.threshold, 3);
  assert.equal(surface.breakthroughReadiness.isAtSemesterCap, false);
});

void test('M.II.1-C/B — path identity and the drip column reflect the selected path and realm', () => {
  const surface = build({
    selectedPathId: 'martial',
    realm: { index: 1, substage: 1, name: 'Foundation Establishment' },
  });
  assert.equal(surface.pathIdentity.pathId, 'martial');
  assert.equal(surface.pathIdentity.pathLabel, 'Martial');
  assert.equal(surface.pathIdentity.signatureMeridianId, 'martial_sword_heart');
  assert.equal(surface.meridianDrip.pathId, 'martial');
  assert.equal(surface.meridianDrip.unlockedCount, 2, 'slots 1..2 revealed at Foundation');

  // no path selected ⇒ the idle identity, empty drip
  const idle = build({ selectedPathId: null });
  assert.equal(idle.pathIdentity.pathLabel, 'No Path selected');
  assert.equal(idle.meridianDrip.slips.length, 0);
});
