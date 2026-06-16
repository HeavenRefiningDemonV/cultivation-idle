import assert from 'node:assert/strict';
import test from 'node:test';

import {
  MERIDIAN_FORM_MEMORY_EXPONENT,
  MERIDIAN_FORM_MEMORY_MULT,
  MERIDIAN_ROOT_ROLL_WEIGHTS,
  accumulateLifetimeRatings,
  applyFormMemoryReset,
  formMemoryFloor,
  rerollMeridianRoots,
  rollSpiritRootGrade,
} from '../../src/systems/prestige/formMemory.js';
import { COMPREHENSION_FLOOR, SPIRIT_ROOT_GRADES, type MeridianTrainingState } from '../../src/systems/meridians/index.js';

/**
 * W11 — N15: the prestige Form-Memory floor (§2.11). Pure + deterministic. The live
 * PrestigeResetService wiring is W13; these contracts lock the floor formula, lifetime
 * accumulation, the weighted root re-roll, and the reincarnation transform.
 */

/** Deterministic rng over a fixed sequence (re-rolls are seeded for the test). */
function seq(values: number[]): () => number {
  let i = 0;
  return () => values[i++ % values.length];
}

function stateOf(ratings: Record<string, number>): MeridianTrainingState {
  const progressByMeridianId: MeridianTrainingState['progressByMeridianId'] = {};
  for (const [id, rating] of Object.entries(ratings)) {
    progressByMeridianId[id] = { rating, ratingXp: 7, masteryXp: 300, comprehension: 1 };
  }
  return { activeMeridianId: Object.keys(ratings)[0] ?? null, rootByMeridianId: {}, progressByMeridianId };
}

test('W11 formMemoryFloor = floor((lifetime)^e × m), 0 at/below 0, monotonic non-decreasing', () => {
  assert.equal(MERIDIAN_FORM_MEMORY_EXPONENT >= 0.5 && MERIDIAN_FORM_MEMORY_EXPONENT <= 0.8, true);
  assert.equal(formMemoryFloor(0), 0);
  assert.equal(formMemoryFloor(-50), 0);
  assert.equal(formMemoryFloor(Number.NaN), 0);
  assert.equal(formMemoryFloor(1), Math.floor(Math.pow(1, MERIDIAN_FORM_MEMORY_EXPONENT) * MERIDIAN_FORM_MEMORY_MULT));
  assert.equal(formMemoryFloor(100), Math.floor(Math.pow(100, 0.6) * 0.5)); // = 7 at defaults
  // monotonic: more lifetime investment never lowers the floor
  let prev = -1;
  for (const n of [0, 5, 25, 100, 400, 1600]) {
    const f = formMemoryFloor(n);
    assert.ok(f >= prev, `floor(${n})=${f} should be >= ${prev}`);
    prev = f;
  }
  // a big lifetime gives a real head start, but far below the raw total (diminishing)
  assert.ok(formMemoryFloor(400) > 0 && formMemoryFloor(400) < 400);
});

test('W11 accumulateLifetimeRatings folds this life into the persisted totals', () => {
  const life1 = accumulateLifetimeRatings({}, stateOf({ m1: 100, m2: 10 }));
  assert.deepEqual(life1, { m1: 100, m2: 10 });
  // a second life adds on top
  const life2 = accumulateLifetimeRatings(life1, stateOf({ m1: 40, m3: 5 }));
  assert.deepEqual(life2, { m1: 140, m2: 10, m3: 5 });
});

test('W11 root roll weights cover every grade, sum to 1, and map the [0,1) line in order', () => {
  const grades = Object.keys(MERIDIAN_ROOT_ROLL_WEIGHTS).sort();
  assert.deepEqual(grades, [...SPIRIT_ROOT_GRADES].sort());
  const sum = SPIRIT_ROOT_GRADES.reduce((acc, g) => acc + MERIDIAN_ROOT_ROLL_WEIGHTS[g], 0);
  assert.ok(Math.abs(sum - 1) < 1e-9, `weights sum to 1 (got ${sum})`);
  assert.equal(rollSpiritRootGrade(() => 0), 'heavenly'); // first bucket
  assert.equal(rollSpiritRootGrade(() => 0.999), 'chaos'); // last bucket
  assert.equal(rollSpiritRootGrade(() => 0.1), 'true'); // 0.05 <= 0.1 < 0.25
  assert.equal(rollSpiritRootGrade(() => 0.3), 'earthly'); // 0.25 <= 0.3 < 0.60
});

test('W11 rerollMeridianRoots assigns a valid grade to every meridian', () => {
  const roll = rerollMeridianRoots(['a', 'b', 'c'], seq([0, 0.3, 0.999]));
  assert.deepEqual(Object.keys(roll).sort(), ['a', 'b', 'c']);
  assert.equal(roll.a, 'heavenly');
  assert.equal(roll.b, 'earthly');
  assert.equal(roll.c, 'chaos');
  for (const g of Object.values(roll)) assert.ok(SPIRIT_ROOT_GRADES.includes(g));
});

test('W11 applyFormMemoryReset: ratings→floor (non-zero after investment), comp/mastery reset, roots re-rolled, lifetime persisted', () => {
  const ids = ['m1', 'm2', 'm3'];
  const before = stateOf({ m1: 100, m2: 10, m3: 0 });
  const { lifetime, state } = applyFormMemoryReset({}, before, ids, seq([0, 0.3, 0.999]));

  // lifetime persisted
  assert.deepEqual(lifetime, { m1: 100, m2: 10, m3: 0 });

  // ratings reset to the floor: invested meridians start > 0, an untouched one stays 0
  assert.equal(state.progressByMeridianId.m1.rating, formMemoryFloor(100));
  assert.ok(state.progressByMeridianId.m1.rating > 0, 're-leveling starts above zero after investment');
  assert.equal(state.progressByMeridianId.m2.rating, formMemoryFloor(10));
  assert.equal(state.progressByMeridianId.m3.rating, 0);

  // per-life fields reset
  for (const id of ids) {
    assert.equal(state.progressByMeridianId[id].ratingXp, 0);
    assert.equal(state.progressByMeridianId[id].masteryXp, 0);
    assert.equal(state.progressByMeridianId[id].comprehension, COMPREHENSION_FLOOR);
  }

  // roots re-rolled for every meridian; active carried
  assert.deepEqual(Object.keys(state.rootByMeridianId).sort(), ids);
  assert.equal(state.rootByMeridianId.m1, 'heavenly');
  assert.equal(state.activeMeridianId, 'm1');

  // a second reincarnation compounds the floor (more lifetime → higher start)
  const second = applyFormMemoryReset(lifetime, stateOf({ m1: 100 }), ids, seq([0.999]));
  assert.equal(second.lifetime.m1, 200);
  assert.ok(second.state.progressByMeridianId.m1.rating > state.progressByMeridianId.m1.rating);
});
