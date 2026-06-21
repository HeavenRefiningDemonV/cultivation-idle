// [F3-ELEM] purity (§7.1) — same inputs → byte-identical outputs; no mutation; no store/save/RNG.
import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  DEFAULT_ELEMENT_TUNING,
  ELEMENT_IDS,
  resolveAffinity,
  resolveReaction,
  resolveResist,
  resolveState,
  type ElementWeights,
  type ResolveCtx,
  type TargetElementState,
} from '../../src/systems/elements/index.js';

const read = (p: string): string => readFileSync(resolve(process.cwd(), p), 'utf8');

const weights: ElementWeights = Object.freeze(
  Object.fromEntries(ELEMENT_IDS.map((id) => [id, id === 'fire' ? 40 : id === 'wood' ? 10 : 0])),
) as ElementWeights;
const ctx: ResolveCtx = Object.freeze({ realm: 3, ruleset: 'pve' });
const target: TargetElementState = Object.freeze({
  resistByElement: weights,
  soulDefense: 0,
  activeStates: Object.freeze([Object.freeze({ state: 'frozen', category: 'control', remainingMs: 1000, intensity: 1 })]),
  icdByPathway: Object.freeze({}),
}) as TargetElementState;

test('F3: each resolver is deterministic — twice with identical inputs yields deep-equal output', () => {
  assert.deepEqual(resolveAffinity(weights, 'fire', ctx, DEFAULT_ELEMENT_TUNING, 'metal'), resolveAffinity(weights, 'fire', ctx, DEFAULT_ELEMENT_TUNING, 'metal'));
  assert.deepEqual(resolveResist(weights, 'fire', ctx, DEFAULT_ELEMENT_TUNING, 'water'), resolveResist(weights, 'fire', ctx, DEFAULT_ELEMENT_TUNING, 'water'));
  assert.deepEqual(resolveReaction('fire', target, ctx, DEFAULT_ELEMENT_TUNING), resolveReaction('fire', target, ctx, DEFAULT_ELEMENT_TUNING));
  assert.deepEqual(resolveState('fire', target, ctx, DEFAULT_ELEMENT_TUNING), resolveState('fire', target, ctx, DEFAULT_ELEMENT_TUNING));
});

test('F3: the resolvers do not mutate their (frozen) arguments', () => {
  resolveAffinity(weights, 'fire', ctx, DEFAULT_ELEMENT_TUNING, 'metal');
  resolveReaction('fire', target, ctx, DEFAULT_ELEMENT_TUNING);
  resolveState('fire', target, ctx, DEFAULT_ELEMENT_TUNING);
  assert.ok(Object.isFrozen(weights) && Object.isFrozen(target) && Object.isFrozen(ctx));
  assert.equal(weights.fire, 40); // unchanged
  assert.equal(target.activeStates.length, 1);
});

test('F3: import hygiene — the resolver reads no store / save / meridian / .tsx, and rolls no RNG', () => {
  const src = read('src/systems/elements/elementResolver.ts');
  assert.doesNotMatch(src, /from\s+['"][^'"]*src\/stores/);
  assert.doesNotMatch(src, /from\s+['"][^'"]*src\/save/);
  assert.doesNotMatch(src, /from\s+['"][^'"]*src\/systems\/meridians/);
  assert.doesNotMatch(src, /from\s+['"][^'"]*\.tsx/);
  assert.doesNotMatch(src, /Math\.random\s*\(/); // an actual RNG call, not a prose mention
});
