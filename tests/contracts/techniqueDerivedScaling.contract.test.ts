import assert from 'node:assert/strict';
import test from 'node:test';

// the stat-engine flag reads window.location.search — provide a mutable window for this isolated file
// (mirrors equipmentDerivedWire.contract.test.ts).
const W = { location: { search: '' }, localStorage: { getItem: () => null, setItem: () => {} } };
(globalThis as unknown as { window: typeof W }).window = W;
const setFlags = (search: string) => {
  W.location.search = search;
};

import { resolveTechniqueScalingSnapshot } from '../../src/systems/techniques/techniqueScalingResolver.js';
import { buildTechniqueDerivedScaling } from '../../src/systems/techniques/techniqueDerivedScalingSource.js';
import {
  elementAffinityDamageMultiplier,
  resolvePlayerElementAffinity,
} from '../../src/systems/elements/elementCombatAffinity.js';
import type { TechniqueDef } from '../../src/content/types.js';

/**
 * M.IV.1 ARTS-MECH / Step 3 — the technique scaling RE-POINT at the live derived layer (flag-aware, byte-
 * identical off) + the F3 element query (D17 verification: "a technique scales off the derived layer, not the
 * tri-stat split" + "element-arts query the F3 resolver").
 */

const TECH = {
  id: 'tq-test-offense',
  name: 'Test Offense Art',
  type: 'active',
  scalingVersion: 'mp4_v1',
  scalingRole: 'offense',
  primaryScalingStatId: 's1',
  secondaryScalingStatId: 's2',
  rootAffinityIds: ['fire'],
} as unknown as TechniqueDef;

// the resolver only reads pathStats[].rating + realmCap off the trainingSnapshot.
const LEGACY_SNAPSHOT = {
  realmCap: 100,
  pathStats: [
    { statId: 's1', rating: 40 },
    { statId: 's2', rating: 40 },
  ],
} as unknown as NonNullable<Parameters<typeof resolveTechniqueScalingSnapshot>[0]>['trainingSnapshot'];

test('Step 3 byte-identical: no derived input ⇒ legacy tri-stat, mode mp4_v1, element edge 1', () => {
  const legacy = resolveTechniqueScalingSnapshot({ technique: TECH, trainingSnapshot: LEGACY_SNAPSHOT });
  const explicitNull = resolveTechniqueScalingSnapshot({ technique: TECH, trainingSnapshot: LEGACY_SNAPSHOT, derived: null });
  assert.equal(legacy.debug.mode, 'mp4_v1', 'legacy mode');
  assert.equal(legacy.elementAffinityMult, 1, 'no element edge in legacy');
  assert.deepEqual(explicitNull, legacy, 'derived:null is byte-identical to omitting it');
  assert.ok(legacy.totalMultiplier > 1, 'legacy scaling is live (rating 40/100)');
});

test('Step 3 derived layer is the source: the same stat with a DIFFERENT derived rating changes the scaling', () => {
  // legacy reads pathStats rating 40; derived supplies the full canonical statRatingsById with rating 90.
  const derivedSnap = resolveTechniqueScalingSnapshot({
    technique: TECH,
    trainingSnapshot: LEGACY_SNAPSHOT,
    derived: { statRatingsById: { s1: 90, s2: 90 }, cap: 100 },
  });
  const legacy = resolveTechniqueScalingSnapshot({ technique: TECH, trainingSnapshot: LEGACY_SNAPSHOT });
  assert.equal(derivedSnap.debug.mode, 'mp4_derived_v1', 'derived mode flagged');
  assert.ok(
    derivedSnap.totalMultiplier > legacy.totalMultiplier,
    'a higher derived rating (90 vs the legacy 40) scales the art higher — the derived layer is the source',
  );
  // and a derived stat OUTSIDE the legacy path view still scales (the full layer, not the path filter).
  const offPath = resolveTechniqueScalingSnapshot({
    technique: { ...TECH, primaryScalingStatId: 'sX', secondaryScalingStatId: 'sY' } as unknown as TechniqueDef,
    trainingSnapshot: LEGACY_SNAPSHOT, // pathStats has neither sX nor sY ⇒ legacy would scale 0
    derived: { statRatingsById: { sX: 70, sY: 70 }, cap: 100 },
  });
  assert.ok(offPath.combatEffectActive, 'an out-of-path stat scales under the derived layer (legacy = 0)');
});

test('Step 3 F3 edge: an element affinity multiplier folds into the total (and never below 1)', () => {
  const withEdge = resolveTechniqueScalingSnapshot({
    technique: TECH,
    trainingSnapshot: LEGACY_SNAPSHOT,
    derived: { statRatingsById: { s1: 40, s2: 40 }, cap: 100, elementAffinityMult: 1.1 },
  });
  const noEdge = resolveTechniqueScalingSnapshot({
    technique: TECH,
    trainingSnapshot: LEGACY_SNAPSHOT,
    derived: { statRatingsById: { s1: 40, s2: 40 }, cap: 100, elementAffinityMult: 1 },
  });
  assert.equal(withEdge.elementAffinityMult, 1.1, 'the edge is surfaced');
  assert.ok(withEdge.totalMultiplier > noEdge.totalMultiplier, 'the edge raises the total');
  // a sub-1 affinity can never reduce the art below its base bonus (floored at 1).
  const floored = resolveTechniqueScalingSnapshot({
    technique: TECH,
    trainingSnapshot: LEGACY_SNAPSHOT,
    derived: { statRatingsById: { s1: 40, s2: 40 }, cap: 100, elementAffinityMult: 0.5 },
  });
  assert.equal(floored.elementAffinityMult, 1, 'element edge floored at 1 (never a penalty)');
});

test('Step 3 seam flag-gate: derived source is null when the engine is off / forceLegacy wins', () => {
  setFlags('');
  assert.equal(buildTechniqueDerivedScaling({ technique: TECH, cap: 100, realm: 3, rootElementId: 'fire' }), null, 'off ⇒ null (legacy)');
  setFlags('?statEngine=1&forceLegacy=1');
  assert.equal(buildTechniqueDerivedScaling({ technique: TECH, cap: 100, realm: 3, rootElementId: 'fire' }), null, 'forceLegacy always wins');
  setFlags('');
});

test('Step 3 seam F3 query: an elemental art queries the F3 resolver; a non-elemental art gets no edge', () => {
  setFlags('?statEngine=1');
  const elemental = buildTechniqueDerivedScaling({ technique: TECH, cap: 100, realm: 3, rootElementId: 'fire' });
  assert.ok(elemental, 'flag-on ⇒ a derived source');
  const expected = elementAffinityDamageMultiplier(
    resolvePlayerElementAffinity({ rootElement: 'fire', realm: 3, engineActive: true }),
  );
  assert.equal(elemental!.elementAffinityMult, expected, 'the seam folds in exactly the F3 resolver affinity');
  assert.ok(typeof elemental!.statRatingsById === 'object', 'the seam supplies the full derived stat ratings');

  const nonElemental = buildTechniqueDerivedScaling({
    technique: { ...TECH, rootAffinityIds: [] } as unknown as TechniqueDef,
    cap: 100,
    realm: 3,
    rootElementId: 'fire',
  });
  assert.equal(nonElemental!.elementAffinityMult, 1, 'a non-elemental art queries no edge (mult 1)');
  setFlags('');
});
