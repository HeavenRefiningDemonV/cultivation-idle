import assert from 'node:assert/strict';
import test from 'node:test';

import { resolveEnemyDefensiveProfile, INERT_ENEMY_DEFENSE, buildEnemyElementWeights } from '../../src/systems/elements/enemyDefensiveProfile.js';
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
