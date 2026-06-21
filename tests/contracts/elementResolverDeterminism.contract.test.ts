// [F3-ELEM] determinism + priority + ICD (§8) — golden reaction outcomes, fixed tie-breaks, caps.
import assert from 'node:assert/strict';
import test from 'node:test';
import {
  DEFAULT_ELEMENT_TUNING,
  ELEMENT_IDS,
  resolveReaction,
  type ElementStateId,
  type ElementWeights,
  type ResolveCtx,
  type StateCategory,
  type TargetElementState,
} from '../../src/systems/elements/index.js';

const ctx: ResolveCtx = { realm: 3, ruleset: 'pve' };
const zero: ElementWeights = Object.fromEntries(ELEMENT_IDS.map((id) => [id, 0])) as ElementWeights;

const CAT: Record<string, StateCategory> = {
  burning: 'dot', frozen: 'control', shocked: 'mark', soaked: 'amplifier', cursed: 'amplifier', voided: 'amplifier',
};
function target(states: ReadonlyArray<[ElementStateId, number]>, icd: Record<string, number> = {}): TargetElementState {
  return {
    resistByElement: zero,
    soulDefense: 0,
    activeStates: states.map(([state, intensity]) => ({ state, category: CAT[state] ?? 'mark', remainingMs: 1000, intensity })),
    icdByPathway: icd,
  };
}

test('F3: golden — fire on Frozen → Thermal Shock (Burst, capped)', () => {
  const ev = resolveReaction('fire', target([['frozen', 1]]), ctx, DEFAULT_ELEMENT_TUNING);
  assert.equal(ev?.reaction, 'thermalShock');
  assert.equal(ev?.family, 'burst');
  assert.equal(ev?.effect.kind, 'burst');
  assert.equal((ev?.effect as { capped?: boolean }).capped, true);
});

test('F3: golden — lightning on Frozen → Superconduct (Shred resolves before any Burst)', () => {
  const ev = resolveReaction('lightning', target([['frozen', 1]]), ctx, DEFAULT_ELEMENT_TUNING);
  assert.equal(ev?.reaction, 'superconduct');
  assert.equal(ev?.family, 'shred');
});

test('F3: golden — a Cleanse outranks every affliction (light on dot+cursed → Purge, priority 1)', () => {
  const ev = resolveReaction('light', target([['burning', 1], ['cursed', 1]]), ctx, DEFAULT_ELEMENT_TUNING);
  assert.equal(ev?.reaction, 'purge');
  assert.equal(ev?.family, 'cleanse');
});

test('F3: golden — soul on Voided → Severance; the effect is sever + capped, bypasses body', () => {
  const ev = resolveReaction('soul', target([['voided', 1]]), ctx, DEFAULT_ELEMENT_TUNING);
  assert.equal(ev?.reaction, 'severance');
  assert.equal(ev?.effect.kind, 'sever');
  assert.equal((ev?.effect as { capped?: boolean; bypassesBody?: boolean }).capped, true);
  assert.equal((ev?.effect as { bypassesBody?: boolean }).bypassesBody, true);
});

test('F3: golden — void on (non-apex) Voided → Unmaking Touch, a passive delta with NO ICD', () => {
  // even with the pathway "on cooldown", Unmaking Touch fires — it has no ICD; the apex Unmake needs full intensity.
  const ev = resolveReaction('void', target([['voided', 1]], { unmakingTouch: 9999, unmake: 9999 }), ctx, DEFAULT_ELEMENT_TUNING);
  assert.equal(ev?.reaction, 'unmakingTouch');
  assert.equal(ev?.family, 'shred');
});

test('F3: within a family, ties break deterministically by the fixed catalog priority order', () => {
  // fire on Frozen+Shocked+Soaked → three Burst reactions eligible; Thermal Shock is earliest → wins.
  const ev = resolveReaction('fire', target([['frozen', 1], ['shocked', 1], ['soaked', 1]]), ctx, DEFAULT_ELEMENT_TUNING);
  assert.equal(ev?.reaction, 'thermalShock');
});

test('F3: ICD — a pathway within its window is skipped; with no other eligible, the result is null', () => {
  const ev = resolveReaction('fire', target([['frozen', 1]], { thermalShock: 3000 }), ctx, DEFAULT_ELEMENT_TUNING);
  assert.equal(ev, null);
});

test('F3: no reaction → null (not a thrown error)', () => {
  assert.equal(resolveReaction('fire', target([]), ctx, DEFAULT_ELEMENT_TUNING), null);
});
