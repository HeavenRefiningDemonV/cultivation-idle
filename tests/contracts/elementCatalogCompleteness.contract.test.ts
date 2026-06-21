// [F3-ELEM] structural truth — the catalog is complete, self-consistent, and referentially closed.
import assert from 'node:assert/strict';
import test from 'node:test';
import {
  ELEMENT_IDS,
  ELEMENT_ROSTER,
  OPPOSITION_EDGES,
  REACTION_CATALOG,
  RESONANCE_EDGES,
  STATE_CATALOG,
} from '../../src/systems/elements/index.js';

const rosterIds = new Set<string>(ELEMENT_IDS);
const stateIds = new Set<string>(STATE_CATALOG.map((s) => s.id));

test('F3: catalog cardinalities — 14 / 20 / 19 / 33 / 21', () => {
  assert.equal(ELEMENT_ROSTER.length, 14);
  assert.equal(RESONANCE_EDGES.length, 20);
  assert.equal(OPPOSITION_EDGES.length, 19);
  assert.equal(REACTION_CATALOG.length, 33);
  assert.equal(STATE_CATALOG.length, 21);
});

test('F3: the 10-family reaction tally', () => {
  const tally: Record<string, number> = {};
  for (const r of REACTION_CATALOG) tally[r.family] = (tally[r.family] ?? 0) + 1;
  assert.deepEqual(tally, {
    cleanse: 2, control: 5, sever: 4, shred: 4, burst: 4,
    spread: 4, dot: 5, drain: 2, tempo: 2, catalyst: 1,
  });
});

test('F3: resonance edges are unique + undirected, degree-sum 40, water = 5 (the connector)', () => {
  const seen = new Set<string>();
  const degree: Record<string, number> = {};
  for (const e of RESONANCE_EDGES) {
    assert.ok(rosterIds.has(e.a) && rosterIds.has(e.b), `endpoint in roster: ${e.a}/${e.b}`);
    assert.notEqual(e.a, e.b, 'no self-loop');
    const key = [e.a, e.b].sort().join('~');
    assert.ok(!seen.has(key), `unique undirected edge: ${key}`);
    seen.add(key);
    degree[e.a] = (degree[e.a] ?? 0) + 1;
    degree[e.b] = (degree[e.b] ?? 0) + 1;
  }
  assert.equal(Object.values(degree).reduce((a, b) => a + b, 0), 40);
  assert.equal(degree.water, 5);
});

test('F3: opposition edges are directed + roster-resolved; earth pivots the two Ring-I cycles (4)', () => {
  for (const o of OPPOSITION_EDGES) {
    assert.ok(rosterIds.has(o.from) && rosterIds.has(o.to), `endpoint in roster: ${o.from}/${o.to}`);
    assert.notEqual(o.from, o.to, 'no self-counter');
  }
  // earth is the pivot of the pentagram + storm-square (its degree within those two cycles is 4).
  const earthCycleEdges = OPPOSITION_EDGES.filter(
    (o) => (o.from === 'earth' || o.to === 'earth') && (o.source === 'pentagram' || o.source === 'storm-square'),
  );
  assert.equal(earthCycleEdges.length, 4);
});

test('F3: resonance and opposition never collide; the dual partners are opposition-only', () => {
  const resonancePairs = new Set(RESONANCE_EDGES.map((e) => [e.a, e.b].sort().join('~')));
  for (const o of OPPOSITION_EDGES) {
    const pair = [o.from, o.to].sort().join('~');
    assert.ok(!resonancePairs.has(pair), `no pair is both resonance and opposition: ${pair}`);
  }
  for (const dual of [['light', 'shadow'], ['soul', 'void'], ['time', 'astral']]) {
    const pair = [...dual].sort().join('~');
    assert.ok(!resonancePairs.has(pair), `dual is opposition-only: ${pair}`);
  }
});

test('F3: referential integrity — every reaction trigger / keyed state / escalation / signature resolves', () => {
  for (const r of REACTION_CATALOG) {
    assert.ok(rosterIds.has(r.trigger.element), `${r.id} applied element resolves`);
    if (r.trigger.keyedState) assert.ok(stateIds.has(r.trigger.keyedState), `${r.id} keyed state resolves`);
    if (r.trigger.keyedCategory) assert.ok(['dot', 'control', 'amplifier', 'mark', 'buff'].includes(r.trigger.keyedCategory));
  }
  for (const s of STATE_CATALOG) {
    assert.ok(rosterIds.has(s.appliedBy), `${s.id} appliedBy resolves`);
    if (s.escalatesTo) assert.ok(stateIds.has(s.escalatesTo), `${s.id} escalatesTo resolves`);
  }
  for (const e of ELEMENT_ROSTER) {
    assert.ok(stateIds.has(e.signatureState), `${e.id} signature state resolves`);
  }
});
