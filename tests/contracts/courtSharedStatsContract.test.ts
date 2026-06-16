import assert from 'node:assert/strict';
import test from 'node:test';

import { COURT_SHARED_STATS, resolveCourtSharedStats } from '../../src/features/court/courtSharedStats.js';
import { CANONICAL_CULTIVATOR_STAT_IDS } from '../../src/systems/cultivatorStats/statDefinitions.js';

/**
 * W13a-3 — the live source for the Court's 13 shared-tier stats. Locks the mapping
 * (Three-Treasures axis/foundation → canonical live stat id) + the pure resolver that
 * reads useTrainingStore.statRatingsById.
 */

test('W13a COURT_SHARED_STATS is 7 axes + 6 foundation, each bound to a real canonical live id', () => {
  assert.equal(COURT_SHARED_STATS.length, 13);
  assert.equal(COURT_SHARED_STATS.filter((s) => s.tier === 'axis').length, 7);
  assert.equal(COURT_SHARED_STATS.filter((s) => s.tier === 'foundation').length, 6);

  const canonical = new Set<string>(CANONICAL_CULTIVATOR_STAT_IDS);
  const usedLiveIds = new Set<string>();
  for (const s of COURT_SHARED_STATS) {
    assert.ok(canonical.has(s.liveStatId), `${s.id} → ${s.liveStatId} must be a canonical live stat id`);
    assert.equal(usedLiveIds.has(s.liveStatId), false, `${s.liveStatId} bound more than once`);
    usedLiveIds.add(s.liveStatId);
    assert.ok(s.zi.length > 0 && s.name.length > 0);
  }
  assert.ok(COURT_SHARED_STATS.some((s) => s.id === 'perception' && s.tier === 'foundation'));
});

test('W13a resolveCourtSharedStats reads live ratings into the shared CourtStatViews', () => {
  const ratings: Record<string, number> = {
    dantian_depth: 46,
    body_integrity: 38,
    qi_purity: 31,
    meridian_throughput: 34,
    spirit_sense: 29,
    mind_clarity: 27,
    dao_stability: 22,
    body_tempering: 24,
    blood_essence: 26,
    armor_harmony: 21,
    recovery_depth: 30,
    meridian_fortitude: 23,
    rooted_guard: 12,
  };
  const { axes, foundation, perception } = resolveCourtSharedStats(ratings);
  assert.equal(axes.length, 7);
  assert.equal(foundation.length, 6);

  const axById = new Map(axes.map((a) => [a.id, a]));
  assert.equal(axById.get('cultivation_base')?.value, 46); // ← dantian_depth
  assert.equal(axById.get('qi_pool')?.value, 38); // ← body_integrity
  assert.equal(axById.get('meridian_openness')?.value, 34); // ← meridian_throughput

  const fById = new Map(foundation.map((f) => [f.id, f]));
  assert.equal(fById.get('physique')?.value, 24); // ← body_tempering
  assert.equal(fById.get('perception')?.value, 30); // ← recovery_depth
  assert.equal(fById.get('luck')?.value, 12); // ← rooted_guard

  assert.equal(perception, 30, 'perception (→ recovery_depth) is surfaced for the rate formula');
});

test('W13a resolveCourtSharedStats defaults missing ratings to 0', () => {
  const { axes, foundation, perception } = resolveCourtSharedStats({});
  assert.equal(axes.every((a) => a.value === 0), true);
  assert.equal(foundation.every((f) => f.value === 0), true);
  assert.equal(perception, 0);
});
