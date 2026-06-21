import assert from 'node:assert/strict';
import test from 'node:test';
import { v2_3_0_seed_three_treasures_from_legacy as step } from '../../src/save/migrations/steps/v2_3_0/seedThreeTreasuresFromLegacy.js';
import type { MigrationContext } from '../../src/save/migrations/migrationTypes.js';

/**
 * F1 / SA-A4 — the v2_3_0 migration is additive, idempotent, never-regress, and honors the D13
 * reincarnation partition (soul-side untouched). This is the in-floor proof of the eight-point
 * cutover gate's "migration proven" point.
 */

function ctx(sourceVersion: string): MigrationContext {
  return { mode: 'apply', sourceVersion, sourceVersionKind: 'legacy-versioned', targetVersion: '2.3.0', nowMs: 0 };
}

test('v2_3_0 seeds an absent meridian slice, is idempotent, and never touches soul-side state', () => {
  const legacy: Record<string, unknown> = {
    version: '2.2.0',
    formMemory: { floors: 3 }, // soul-side (Form-Memory)
    prestigeState: { totalAP: 42 }, // soul-side
    gameState: { realm: { index: 2 } },
    trainingState: { schemaVersion: 1, statRatingsById: { body_tempering: 50 } },
  };

  // First run on a legacy save (slice absent) → seeds it.
  assert.equal(step.appliesTo(legacy, ctx('2.2.0')), true);
  const r1 = step.run(legacy, ctx('2.2.0'));
  assert.equal(r1.didMutate, true);
  const after1 = r1.save as Record<string, any>;
  assert.ok(after1.meridianCourtState, 'meridian slice is seeded');
  assert.deepEqual(after1.meridianCourtState.progressByMeridianId, {});
  assert.deepEqual(after1.meridianCourtState.rootByMeridianId, {});
  assert.equal(after1.meridianCourtState.fatigue, 0);
  assert.equal(after1.meridianCourtState.intensityId, 'steady');

  // Soul-side untouched (D13 partition) and the source object was cloned, not mutated.
  assert.deepEqual(after1.formMemory, { floors: 3 });
  assert.deepEqual(after1.prestigeState, { totalAP: 42 });
  assert.equal('meridianCourtState' in legacy, false, 'additive: the source save is not mutated in place');

  // Idempotent: a save already seeded + at the current version does not re-apply.
  assert.equal(step.appliesTo(after1, ctx('2.3.0')), false);
});

test('v2_3_0 preserves an existing valid meridian slice (never-regress)', () => {
  const earned: Record<string, unknown> = {
    version: '2.2.0',
    meridianCourtState: {
      activeMeridianId: 'martial_weapon_intent',
      rootByMeridianId: { martial_weapon_intent: 'true' },
      progressByMeridianId: { martial_weapon_intent: { rating: 77 } },
      lifetimeTotals: { martial_weapon_intent: 120 },
      intensityId: 'steady',
      fatigue: 12,
    },
  };

  const r = step.run(earned, ctx('2.2.0'));
  assert.equal(r.didMutate, false, 'a valid slice is preserved, not rewritten');
  const after = r.save as Record<string, any>;
  assert.equal(after.meridianCourtState.progressByMeridianId.martial_weapon_intent.rating, 77, 'earned rating not lowered');
  assert.equal(after.meridianCourtState.lifetimeTotals.martial_weapon_intent, 120);
  assert.equal(after.meridianCourtState.fatigue, 12);
});

test('v2_3_0 replaces a malformed slice with a safe empty slice and warns (no crash/wipe)', () => {
  const malformed: Record<string, unknown> = { version: '2.2.0', meridianCourtState: { garbage: true } };
  assert.equal(step.appliesTo(malformed, ctx('2.2.0')), true);
  const r = step.run(malformed, ctx('2.2.0'));
  assert.equal(r.didMutate, true);
  assert.ok(r.warnings.some((w) => w.code === 'malformed-meridian-court-state'));
  assert.deepEqual((r.save as Record<string, any>).meridianCourtState.progressByMeridianId, {});
});
