import assert from 'node:assert/strict';
import test from 'node:test';

import { resolvePremonitionOmens } from '../../src/systems/cultivation/premonitionOmenResolver.js';
import { PREMONITION_FORTUNE_OMENS, PREMONITION_RISK_OMENS } from '../../src/systems/ui/cultivation/cultivationPathData.js';

const TONES = new Set(['jade', 'gold', 'cinnabar', 'neutral']);

void test('C-PATH Premonition — engine OFF returns the honest preview byte-for-byte (preserve-first)', () => {
  const off = resolvePremonitionOmens({ realmIndex1to7: 6, perception: 999, idleRunning: true, engineActive: false });
  assert.equal(off.active, false);
  assert.equal(off.horizon, 0);
  assert.equal(off.precision, 'vague');
  // the full authored omen tables, unmodified (what the "not yet active" preview shows today)
  assert.deepEqual(off.fortuneOmens.map((o) => o.label), PREMONITION_FORTUNE_OMENS.map((o) => o.label));
  assert.deepEqual(off.riskOmens.map((o) => o.label), PREMONITION_RISK_OMENS.map((o) => o.label));
});

void test('C-PATH Premonition — precision is gated by the AUTHORED realm cadence (no invented curve)', () => {
  const at = (realm: number) => resolvePremonitionOmens({ realmIndex1to7: realm, perception: 10, idleRunning: true, engineActive: true });
  assert.equal(at(1).precision, 'vague');
  assert.equal(at(2).precision, 'vague');
  assert.equal(at(3).precision, 'banded');
  assert.equal(at(4).precision, 'banded');
  assert.equal(at(5).precision, 'precise');
  assert.equal(at(6).precision, 'precise');
});

void test('C-PATH Premonition — omens come into focus as foresight sharpens (information, not power)', () => {
  const vague = resolvePremonitionOmens({ realmIndex1to7: 1, perception: 10, idleRunning: true, engineActive: true });
  const banded = resolvePremonitionOmens({ realmIndex1to7: 3, perception: 10, idleRunning: true, engineActive: true });
  const precise = resolvePremonitionOmens({ realmIndex1to7: 5, perception: 10, idleRunning: true, engineActive: true });
  assert.equal(vague.active, true);
  assert.equal(vague.fortuneOmens.length, 1, 'vague reveals only the live wind omen');
  assert.equal(vague.riskOmens.length, 0, 'risk omens are hidden until precise');
  assert.equal(banded.fortuneOmens.length, 2, 'banded adds the second fortune omen');
  assert.equal(banded.riskOmens.length, 0);
  assert.ok(precise.riskOmens.length >= 1, 'precise (R5+ Void Gaze) sees the risk omens');
});

void test('C-PATH Premonition — the wind omen is a REAL idle-state read (§F)', () => {
  const accruing = resolvePremonitionOmens({ realmIndex1to7: 2, perception: 10, idleRunning: true, engineActive: true });
  const held = resolvePremonitionOmens({ realmIndex1to7: 2, perception: 10, idleRunning: false, engineActive: true });
  assert.equal(accruing.fortuneOmens[0].value, 'favorable');
  assert.equal(held.fortuneOmens[0].value, 'stilled');
  assert.notEqual(accruing.fortuneOmens[0].detail, held.fortuneOmens[0].detail);
});

void test('C-PATH Premonition — perception is surfaced as foresight depth; omen tones stay in the union', () => {
  const r = resolvePremonitionOmens({ realmIndex1to7: 5, perception: 42.6, idleRunning: true, engineActive: true });
  assert.equal(r.horizon, 43, 'the live perception rating IS the foresight depth (rounded)');
  for (const o of [...r.fortuneOmens, ...r.riskOmens]) assert.ok(TONES.has(o.tone), `tone ${o.tone} in union`);
});
