import assert from 'node:assert/strict';
import test from 'node:test';

import { resolveEnemyDefensiveProfile, INERT_ENEMY_DEFENSE, buildEnemyElementWeights, resolveEnemyElementResist } from '../../src/systems/elements/enemyDefensiveProfile.js';
import { DEFAULT_ELEMENT_TUNING } from '../../src/systems/elements/elementTuning.js';
import { derivedRealmScalar } from '../../src/systems/meridians/derivedStats.js';
import type { EnemyDefinition } from '../../src/types/index.js';

const enemy = (element?: string): EnemyDefinition => ({ element } as unknown as EnemyDefinition);
const tune = (over: Partial<typeof DEFAULT_ELEMENT_TUNING>) => ({ ...DEFAULT_ELEMENT_TUNING, ...over });

void test('Enemy-derived A — preserve-first: flag OFF returns the INERT profile', () => {
  const out = resolveEnemyDefensiveProfile({ enemy: enemy('fire'), realm: 5, engineActive: false, tuning: DEFAULT_ELEMENT_TUNING });
  assert.equal(out, INERT_ENEMY_DEFENSE);
  assert.equal(out.staggerResist, 0);
  assert.equal(out.ccResist, 0);
});

void test('Enemy-derived A — shipped default (all bases 0) ⇒ neutral profile even flag-on (byte-identical)', () => {
  const out = resolveEnemyDefensiveProfile({ enemy: enemy('fire'), realm: 5, engineActive: true, tuning: DEFAULT_ELEMENT_TUNING });
  assert.equal(out.staggerResist, 0);
  assert.equal(out.ccResist, 0);
  assert.equal(Object.values(out.resistByElement).every((w) => w === 0), true, 'per-element resist all 0 (base held 0)');
});

void test('Enemy-derived A — injected bases prove the mechanism: flat × the realm scalar', () => {
  const out = resolveEnemyDefensiveProfile({ enemy: enemy('fire'), realm: 3, engineActive: true, tuning: tune({ enemyStaggerBase: 2, enemyCcResistBase: 1, enemyElementResistBase: 0.3 }) });
  assert.equal(out.staggerResist, 2 * derivedRealmScalar(3), 'staggerResist = base × realmScalar');
  assert.equal(out.ccResist, 1 * derivedRealmScalar(3));
  assert.equal(out.resistByElement.fire, 0.3, 'the enemy element carries the per-element resist base');
});

void test('Enemy-derived A — staggerResist scales with realm (the shared ρ ladder)', () => {
  const t = tune({ enemyStaggerBase: 2 });
  const r1 = resolveEnemyDefensiveProfile({ enemy: enemy('fire'), realm: 1, engineActive: true, tuning: t });
  const r5 = resolveEnemyDefensiveProfile({ enemy: enemy('fire'), realm: 5, engineActive: true, tuning: t });
  assert.equal(r1.staggerResist, 2, 'realm 1 ⇒ scalar 1');
  assert.ok(r5.staggerResist > r1.staggerResist, 'higher realm ⇒ larger flat resist');
});

void test('Enemy-derived A — no enemy element ⇒ zero resist vector; purity (frozen, shared zero)', () => {
  const out = resolveEnemyDefensiveProfile({ enemy: enemy(undefined), realm: 5, engineActive: true, tuning: tune({ enemyElementResistBase: 0.5 }) });
  assert.equal(Object.values(out.resistByElement).every((w) => w === 0), true, 'no element ⇒ ZERO weights');
  assert.equal(Object.isFrozen(out), true, 'result is frozen (pure)');
  assert.equal(buildEnemyElementWeights(null, DEFAULT_ELEMENT_TUNING), buildEnemyElementWeights(undefined, DEFAULT_ELEMENT_TUNING), 'null/undefined ⇒ the shared frozen zero vector');
});

// ─── Slice C: enemy element resist (shred lowers it) ─────────────────────────────────────────────

void test('Enemy-derived C — resist is 0 flag-off and 0 at the held default (no reduction ⇒ byte-identical)', () => {
  assert.equal(resolveEnemyElementResist({ enemy: enemy('fire'), incomingElement: 'fire', realm: 5, engineActive: false, shredResistDelta: 0, tuning: tune({ enemyElementResistBase: 0.5 }) }), 0, 'flag-off ⇒ 0');
  assert.equal(resolveEnemyElementResist({ enemy: enemy('fire'), incomingElement: 'fire', realm: 5, engineActive: true, shredResistDelta: 0, tuning: DEFAULT_ELEMENT_TUNING }), 0, 'held base 0 ⇒ no resist');
});

void test('Enemy-derived C — injected enemy resist reduces matchup-element damage; shred lowers the resist', () => {
  const t = tune({ enemyElementResistBase: 0.5 });
  const full = resolveEnemyElementResist({ enemy: enemy('fire'), incomingElement: 'fire', realm: 5, engineActive: true, shredResistDelta: 0, tuning: t });
  assert.ok(full > 0, 'a fire enemy resists incoming fire (its matchup element)');
  const shredded = resolveEnemyElementResist({ enemy: enemy('fire'), incomingElement: 'fire', realm: 5, engineActive: true, shredResistDelta: 0.5, tuning: t });
  assert.ok(shredded < full, 'shred reduces the enemy resist (pre-curve subtraction)');
  assert.equal(resolveEnemyElementResist({ enemy: enemy('fire'), incomingElement: 'water', realm: 5, engineActive: true, shredResistDelta: 0, tuning: t }), 0, 'an element the enemy has no weight for ⇒ 0 resist');
});
