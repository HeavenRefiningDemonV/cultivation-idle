import assert from 'node:assert/strict';
import test from 'node:test';

import {
  applyReclaimDeltaUntilPriorBest,
  buildCompositeRouteMemoryKey,
  buildGateMemoryKey,
  buildHeartLawMemoryKey,
  buildPathTrainingMemoryKey,
  buildSpiritRootMemoryKey,
  createPrestigeMemoryRecord,
  mergePrestigeMemoryRecords,
  resolvePrestigeReclaimState,
} from '../../src/systems/prestige/prestigeMemoryResolver.js';

const rootKey = buildSpiritRootMemoryKey({
  rootElement: 'fire',
  shape: 'single',
  variantKey: 'ember_seed',
  lawPair: 'heartlaw_ember_thread',
});

const alternateRootKey = buildSpiritRootMemoryKey({
  rootElement: 'fire',
  shape: 'single',
  variantKey: 'ember_seed',
  lawPair: 'heartlaw_quiet_breath',
});

const exactRouteKey = buildCompositeRouteMemoryKey({
  pathId: 'heaven',
  heartLawId: 'heartlaw_ember_thread',
  rootKey,
  gateChainId: 'pinewind_gate_chain',
});

const baseCurrentRoute = {
  lifeId: 'life-2',
  realmIndex: 0,
  path: {
    pathId: 'heaven',
    statId: 'qi_control',
    regimenId: 'still_star_breathing',
    realmBand: 'realm_0',
    currentRating: 30,
    currentRealmCap: 60,
  },
  heartLaw: {
    heartLawId: 'heartlaw_ember_thread',
    chapterBand: 'chapter_1',
    verseId: 'verse_ember_1',
    lawLevel: 4,
    verseMastery: 45,
    unlocked: true,
  },
  spiritRoot: {
    rootElement: 'fire',
    shape: 'single',
    variantKey: 'ember_seed',
    lawPair: 'heartlaw_ember_thread',
    rootResonance: 35,
  },
  gate: {
    trialId: 'trial_novices_clearing',
    gateId: 'gate_qi_condensation_1',
    cityId: 'city_pinewind_hamlet',
    gateCleared: false,
    reached: true,
  },
  composite: {
    pathId: 'heaven',
    heartLawId: 'heartlaw_ember_thread',
    rootKey,
    gateChainId: 'pinewind_gate_chain',
  },
};

test('path memory exact match is active and stops at the remembered prior best', () => {
  const record = createPrestigeMemoryRecord({
    domain: 'path_training',
    componentKey: buildPathTrainingMemoryKey({
      pathId: 'heaven',
      statId: 'qi_control',
      regimenId: 'still_star_breathing',
      realmBand: 'realm_0',
    }),
    routeBundleKey: exactRouteKey,
    priorBest: { realmIndex: 0, rating: 42 },
    lastLifeId: 'life-1',
    reclaimRank: 2,
  });

  const surface = resolvePrestigeReclaimState({
    records: [record],
    current: baseCurrentRoute,
    reclaimRank: 2,
  });

  assert.equal(surface.summary.activeCount, 1);
  assert.equal(surface.summary.dormantCount, 0);
  assert.equal(surface.summary.atPriorBestCount, 0);
  assert.equal(surface.rows[0]?.state, 'active');
  assert.equal(surface.rows[0]?.reasonCode, 'active_exact_match');
  assert.equal(surface.rows[0]?.activeMultiplier, 1.65);
  assert.equal(surface.rows[0]?.activeFloorValue > 0, true);
  assert.match(surface.rows[0]?.stopConditionLabel ?? '', /rating 42/i);
});

test('mismatched route yields active component memory, dormant root memory, and partial composite state', () => {
  const pathRecord = createPrestigeMemoryRecord({
    domain: 'path_training',
    componentKey: buildPathTrainingMemoryKey({
      pathId: 'heaven',
      statId: 'qi_control',
      regimenId: 'still_star_breathing',
      realmBand: 'realm_0',
    }),
    routeBundleKey: exactRouteKey,
    priorBest: { realmIndex: 0, rating: 42 },
    lastLifeId: 'life-1',
    reclaimRank: 1,
  });
  const rootRecord = createPrestigeMemoryRecord({
    domain: 'spirit_root',
    componentKey: rootKey,
    routeBundleKey: exactRouteKey,
    priorBest: { realmIndex: 0, rootResonance: 61 },
    lastLifeId: 'life-1',
    reclaimRank: 1,
  });
  const compositeRecord = createPrestigeMemoryRecord({
    domain: 'composite_route',
    componentKey: exactRouteKey,
    routeBundleKey: exactRouteKey,
    priorBest: { realmIndex: 0, rating: 42 },
    lastLifeId: 'life-1',
    reclaimRank: 1,
  });

  const surface = resolvePrestigeReclaimState({
    records: [pathRecord, rootRecord, compositeRecord],
    current: {
      ...baseCurrentRoute,
      spiritRoot: {
        ...baseCurrentRoute.spiritRoot,
        lawPair: 'heartlaw_quiet_breath',
      },
      composite: {
        ...baseCurrentRoute.composite,
        rootKey: alternateRootKey,
      },
    },
    reclaimRank: 1,
  });

  const rowsByDomain = new Map(surface.rows.map((row) => [row.record.domain, row]));
  assert.equal(rowsByDomain.get('path_training')?.state, 'active');
  assert.equal(rowsByDomain.get('spirit_root')?.state, 'dormant');
  assert.equal(rowsByDomain.get('spirit_root')?.reasonCode, 'law_pair_mismatch');
  assert.equal(rowsByDomain.get('composite_route')?.state, 'partial_component_only');
  assert.equal(surface.summary.activeCount, 1);
  assert.equal(surface.summary.partialCount, 1);
  assert.equal(surface.summary.exactCompositeActive, false);
});

test('exact composite route adds only a small bonus to already active component memories', () => {
  const pathRecord = createPrestigeMemoryRecord({
    domain: 'path_training',
    componentKey: buildPathTrainingMemoryKey({
      pathId: 'heaven',
      statId: 'qi_control',
      regimenId: 'still_star_breathing',
      realmBand: 'realm_0',
    }),
    routeBundleKey: exactRouteKey,
    priorBest: { realmIndex: 0, rating: 42 },
    lastLifeId: 'life-1',
    reclaimRank: 1,
  });
  const compositeRecord = createPrestigeMemoryRecord({
    domain: 'composite_route',
    componentKey: exactRouteKey,
    routeBundleKey: exactRouteKey,
    priorBest: { realmIndex: 0, rating: 42 },
    lastLifeId: 'life-1',
    reclaimRank: 1,
  });

  const surface = resolvePrestigeReclaimState({
    records: [pathRecord, compositeRecord],
    current: baseCurrentRoute,
    reclaimRank: 1,
  });

  assert.equal(surface.summary.exactCompositeActive, true);
  assert.equal(surface.rows.find((row) => row.record.domain === 'path_training')?.activeMultiplier, 1.55);
  assert.equal(surface.rows.find((row) => row.record.domain === 'composite_route')?.activeFloorValue, 0);
});

test('at prior best state disables multiplier and explains future progress is new cultivation', () => {
  const record = createPrestigeMemoryRecord({
    domain: 'path_training',
    componentKey: buildPathTrainingMemoryKey({
      pathId: 'heaven',
      statId: 'qi_control',
      regimenId: 'still_star_breathing',
      realmBand: 'realm_0',
    }),
    priorBest: { realmIndex: 0, rating: 42 },
    lastLifeId: 'life-1',
    reclaimRank: 3,
  });

  const surface = resolvePrestigeReclaimState({
    records: [record],
    current: {
      ...baseCurrentRoute,
      path: { ...baseCurrentRoute.path, currentRating: 42 },
    },
    reclaimRank: 3,
  });

  assert.equal(surface.rows[0]?.state, 'at_prior_best');
  assert.equal(surface.rows[0]?.reasonCode, 'at_prior_best');
  assert.equal(surface.rows[0]?.activeMultiplier, 1);
  assert.equal(surface.rows[0]?.activeFloorValue, 0);
  assert.match(surface.rows[0]?.playerReason ?? '', /future progress is new cultivation/i);
});

test('unknown content stays inspectable as dormant instead of crashing', () => {
  const record = createPrestigeMemoryRecord({
    domain: 'gate',
    componentKey: buildGateMemoryKey({
      trialId: 'missing_trial',
      gateId: 'gate_qi_condensation_1',
      cityId: 'city_pinewind_hamlet',
    }),
    priorBest: { realmIndex: 0, gateCleared: true },
    lastLifeId: 'life-1',
    reclaimRank: 1,
  });

  const surface = resolvePrestigeReclaimState({
    records: [record],
    current: baseCurrentRoute,
    reclaimRank: 1,
    knownComponentKeys: new Set(),
  });

  assert.equal(surface.rows[0]?.state, 'dormant');
  assert.equal(surface.rows[0]?.reasonCode, 'content_unknown');
  assert.match(surface.rows[0]?.playerReason ?? '', /no longer exists/i);
});

test('duplicate records dedupe by component key and keep strongest prior best with invariant caps', () => {
  const low = createPrestigeMemoryRecord({
    domain: 'heart_law',
    componentKey: buildHeartLawMemoryKey({
      heartLawId: 'heartlaw_ember_thread',
      chapterBand: 'chapter_1',
      verseId: 'verse_ember_1',
    }),
    priorBest: { realmIndex: 0, lawLevel: 3, verseMastery: 20 },
    lifetimeUses: 1,
    lastLifeId: 'life-1',
    reclaimRank: 1,
  });
  const high = createPrestigeMemoryRecord({
    domain: 'heart_law',
    componentKey: low.componentKey,
    priorBest: { realmIndex: 0, lawLevel: 6, verseMastery: 80 },
    lifetimeUses: 2,
    lastLifeId: 'life-2',
    reclaimRank: 1,
  });

  const merged = mergePrestigeMemoryRecords([low, high]);

  assert.equal(merged.length, 1);
  assert.equal(merged[0]?.priorBest.lawLevel, 6);
  assert.equal(merged[0]?.priorBest.verseMastery, 80);
  assert.equal(merged[0]?.lifetimeUses, 3);
  assert.equal(merged[0]?.reclaimCaps.stopsAtPriorBest, true);
});

test('catch-up multiplier splits at prior best and applies normal progress after the boundary', () => {
  const result = applyReclaimDeltaUntilPriorBest({
    currentValue: 8,
    baseDelta: 10,
    priorBestValue: 10,
    multiplier: 2,
    active: true,
  });

  assert.equal(result.reachedPriorBest, true);
  assert.equal(result.delta, 11);
});
