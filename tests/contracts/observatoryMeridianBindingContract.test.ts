import assert from 'node:assert/strict';
import test from 'node:test';

import {
  DERIVED_STAT_DISPLAY,
  MERIDIAN_ROOTS,
  type CourtStatView,
  type DerivedStatKey,
} from '../../src/systems/meridians/index.js';
// observatoryMeridianBinding is imported from its leaf (not the meridians barrel), which
// no longer re-exports it — the barrel must stay ui-free for the save/progression projects.
import {
  MERIDIAN_CONSTELLATION_NODE_MAP,
  MERIDIAN_CONSTELLATION_TIER2_KEYS,
  buildMeridianConstellationSurface,
  meridianAstrolabeAptitudeChips,
  type MeridianConstellationInput,
} from '../../src/systems/meridians/observatoryMeridianBinding.js';
import { STATUS_OBSERVATORY_STAT_NODE_GEOMETRY } from '../../src/systems/ui/status/statusObservatoryPresentation.js';

/**
 * W8 — the Observatory ⇄ Three-Treasures re-bind (D8/D9), ADDITIVE + flag-gated.
 * These contracts pin the NEW meridian-bound constellation builder + the explicit
 * 20→28 node map. The LIVE legacy-bound observatory + its 28-node contracts are a
 * SEPARATE suite and stay untouched (the re-bind activates at the W13 cutover).
 */

const AXES: CourtStatView[] = [
  { id: 'cultivation_base', zi: '修为', name: 'Cultivation Base', value: 46 },
  { id: 'qi_pool', zi: '灵力', name: 'Qi Pool', value: 38 },
  { id: 'qi_purity', zi: '气纯', name: 'Qi Purity', value: 31 },
  { id: 'meridian_openness', zi: '经脉', name: 'Meridian Openness', value: 34 },
  { id: 'spiritual_sense', zi: '神识', name: 'Spiritual Sense', value: 29 },
  { id: 'soul_strength', zi: '魂', name: 'Soul Strength', value: 27 },
  { id: 'dao_comprehension', zi: '道', name: 'Dao Comprehension', value: 22 },
];
const FOUNDATION: CourtStatView[] = [
  { id: 'physique', zi: '体', name: 'Physique', value: 24 },
  { id: 'vitality', zi: '元', name: 'Vitality', value: 26 },
  { id: 'agility', zi: '敏', name: 'Agility', value: 21 },
  { id: 'perception', zi: '悟', name: 'Perception', value: 30 },
  { id: 'willpower', zi: '志', name: 'Willpower', value: 23 },
  { id: 'luck', zi: '运', name: 'Luck', grade: '慧 · Auspicious' },
];
const DERIVED: Partial<Record<DerivedStatKey, number>> = {
  physAttack: 120,
  attackSpeed: 14,
  speed: 33,
  accuracy: 88,
  evasion: 17,
  critChance: 9,
  armorPen: 12,
};

const INPUT: MeridianConstellationInput = {
  currentPath: 'martial',
  axes: AXES,
  foundation: FOUNDATION,
  derived: DERIVED,
  realmCap: 100,
};

test('W8 map mirrors the 28 fixed constellation node ids + branches exactly (drop-in)', () => {
  const geometry = STATUS_OBSERVATORY_STAT_NODE_GEOMETRY as Record<string, { id: string; branch: string }>;
  const geometryIds = Object.keys(geometry).sort();
  const mapIds = MERIDIAN_CONSTELLATION_NODE_MAP.map((entry) => entry.nodeId).sort();

  assert.equal(MERIDIAN_CONSTELLATION_NODE_MAP.length, 28);
  assert.deepEqual(mapIds, geometryIds, 'map node ids must equal the live geometry ids 1:1');
  assert.equal(new Set(mapIds).size, 28, 'no duplicate node ids');

  for (const entry of MERIDIAN_CONSTELLATION_NODE_MAP) {
    assert.equal(entry.branchId, geometry[entry.nodeId].branch, `${entry.nodeId} branch must match live geometry`);
  }
});

test('W8 map binds exactly 20 of 28 nodes with the 6/7/7 tier split, 8 sockets', () => {
  const bound = MERIDIAN_CONSTELLATION_NODE_MAP.filter((entry) => entry.tier !== null);
  const sockets = MERIDIAN_CONSTELLATION_NODE_MAP.filter((entry) => entry.tier === null);
  assert.equal(bound.length, 20);
  assert.equal(sockets.length, 8);

  const tierCounts = { tier0: 0, tier1: 0, tier2: 0 };
  for (const entry of bound) tierCounts[entry.tier as keyof typeof tierCounts] += 1;
  assert.deepEqual(tierCounts, { tier0: 6, tier1: 7, tier2: 7 });

  // branch distribution preserves the fixed 8-7-6-7 silhouette
  const branchCounts = { universal: 0, heaven: 0, earth: 0, martial: 0 };
  for (const entry of MERIDIAN_CONSTELLATION_NODE_MAP) branchCounts[entry.branchId] += 1;
  assert.deepEqual(branchCounts, { universal: 8, heaven: 7, earth: 6, martial: 7 });

  // semantic rule: spine=Tier-1 axes, earth=Tier-0 foundation, martial=Tier-2 derived, heaven=sockets
  for (const entry of bound) {
    if (entry.branchId === 'universal') assert.equal(entry.tier, 'tier1');
    if (entry.branchId === 'earth') assert.equal(entry.tier, 'tier0');
    if (entry.branchId === 'martial') assert.equal(entry.tier, 'tier2');
  }
  assert.equal(
    MERIDIAN_CONSTELLATION_NODE_MAP.filter((e) => e.branchId === 'heaven').every((e) => e.tier === null),
    true,
    'all heaven nodes are sockets',
  );
});

test('W8 map binds each meridian stat at most once, to valid sources', () => {
  const axisIds = new Set(AXES.map((view) => view.id));
  const foundationIds = new Set(FOUNDATION.map((view) => view.id));
  const used = new Set<string>();
  for (const entry of MERIDIAN_CONSTELLATION_NODE_MAP) {
    if (entry.source.kind === 'socket') continue;
    const key =
      entry.source.kind === 'derived' ? `derived:${entry.source.key}` : `${entry.source.kind}:${entry.source.statId}`;
    assert.equal(used.has(key), false, `${key} bound more than once`);
    used.add(key);
    if (entry.source.kind === 'axis') assert.equal(axisIds.has(entry.source.statId), true, `${entry.source.statId} is an axis id`);
    if (entry.source.kind === 'foundation') assert.equal(foundationIds.has(entry.source.statId), true, `${entry.source.statId} is a foundation id`);
    if (entry.source.kind === 'derived') assert.ok(DERIVED_STAT_DISPLAY[entry.source.key], `${entry.source.key} is a derived key`);
  }
  // all 7 axes + all 6 foundation bound (Tier-2 is a curated 7, not the full 21)
  assert.equal(MERIDIAN_CONSTELLATION_NODE_MAP.filter((e) => e.source.kind === 'axis').length, 7);
  assert.equal(MERIDIAN_CONSTELLATION_NODE_MAP.filter((e) => e.source.kind === 'foundation').length, 6);
  assert.equal(MERIDIAN_CONSTELLATION_TIER2_KEYS.length, 7);
  assert.equal(new Set(MERIDIAN_CONSTELLATION_TIER2_KEYS).size, 7);
});

test('W8 builder produces a drop-in 28-node surface: 20 bound + 8 socket, new subtitle', () => {
  const surface = buildMeridianConstellationSurface(INPUT);
  const geometryIds = Object.keys(STATUS_OBSERVATORY_STAT_NODE_GEOMETRY).sort();

  assert.equal(surface.nodes.length, 28);
  assert.deepEqual(surface.nodes.map((node) => node.id).sort(), geometryIds);
  assert.equal(surface.subtitle, '20 Named Stats — Three Treasures');
  assert.deepEqual(surface.branchCounts, { universal: 8, heaven: 7, earth: 6, martial: 7 });

  const sockets = surface.nodes.filter((node) => node.nodeState === 'future');
  const bound = surface.nodes.filter((node) => node.nodeState !== 'future');
  assert.equal(sockets.length, 8);
  assert.equal(bound.length, 20);

  // the default lens points at a bound node
  assert.ok(surface.selectedLensDefaultStatId);
  const lens = surface.nodes.find((node) => node.id === surface.selectedLensDefaultStatId);
  assert.ok(lens && lens.nodeState !== 'future', 'default lens stat is a bound node');

  // every node is well-formed (no relapse to empty/illegal fields)
  for (const node of surface.nodes) {
    assert.equal(node.visible, true);
    assert.ok(node.displayName.trim().length > 0, `${node.id} displayName non-empty`);
    assert.ok(node.shortLabel.trim().length > 0, `${node.id} shortLabel non-empty`);
    assert.ok(node.effectSummary.trim().length > 0, `${node.id} effectSummary non-empty`);
    assert.match(node.branchId, /^(universal|heaven|earth|martial)$/);
    assert.match(node.nodeState, /^(lit|foundation|lifeless|unlit_socket|future|inactive)$/);
    assert.equal(node.weakLink, false);
  }
});

test('W8 builder threads meridian-stat values onto the bound nodes', () => {
  const surface = buildMeridianConstellationSurface(INPUT);
  const byId = new Map(surface.nodes.map((node) => [node.id, node]));

  // Tier-1 axis: cultivation_base -> dantian_depth
  assert.equal(byId.get('dantian_depth')?.currentRating, 46);
  assert.equal(byId.get('dantian_depth')?.cap, 100);
  assert.equal(byId.get('dantian_depth')?.nodeState, 'foundation');
  assert.equal(byId.get('dantian_depth')?.tone, 'jade');

  // Tier-0 foundation: physique -> body_tempering
  assert.equal(byId.get('body_tempering')?.currentRating, 24);
  assert.equal(byId.get('body_tempering')?.branchId, 'earth');

  // Tier-2 derived: physAttack -> weapon_intent (lit, gold, no cap)
  assert.equal(byId.get('weapon_intent')?.currentRating, 120);
  assert.equal(byId.get('weapon_intent')?.cap, 0);
  assert.equal(byId.get('weapon_intent')?.nodeState, 'lit');
  assert.equal(byId.get('weapon_intent')?.tone, 'gold');
  assert.equal(byId.get('weapon_intent')?.displayName, DERIVED_STAT_DISPLAY.physAttack.label);

  // socket: heaven node + the spare spine node
  assert.equal(byId.get('dao_resonance')?.nodeState, 'future');
  assert.equal(byId.get('medicine_familiarity')?.nodeState, 'future');
  assert.equal(byId.get('medicine_familiarity')?.currentRating, 0);
});

test('W8 builder marks the current heaven path sockets as future-current (no failure language)', () => {
  const surface = buildMeridianConstellationSurface({ ...INPUT, currentPath: 'heaven' });
  const heaven = surface.nodes.filter((node) => node.branchId === 'heaven');
  assert.equal(heaven.length, 7);
  for (const node of heaven) {
    assert.equal(node.unlockState, 'future_current_path');
    assert.equal(node.contributionState, 'future_current_path');
    assert.doesNotMatch(`${node.label} ${node.effectSummary}`, /\bfail|\bfailure|\bred\b/i);
  }
});

test('W8 astrolabe aptitude chips surface the rolled root grade per meridian (D8)', () => {
  const chips = meridianAstrolabeAptitudeChips([
    { id: 'martial_weapon_intent', name: 'Weapon Intent', root: MERIDIAN_ROOTS.heavenly },
    { id: 'martial_battle_rhythm', name: 'Battle Rhythm', root: MERIDIAN_ROOTS.true },
    { id: 'martial_flow_step', name: 'Flow Step', root: MERIDIAN_ROOTS.chaos },
  ]);
  assert.equal(chips.length, 3);
  assert.deepEqual(chips[0], {
    meridianId: 'martial_weapon_intent',
    meridianName: 'Weapon Intent',
    gradeKey: 'heavenly',
    gradeLabel: 'Heavenly Root',
    chipClass: 'heavenly',
  });
  assert.equal(chips[2].gradeLabel, 'Chaos Root');
  for (const chip of chips) assert.ok(chip.chipClass.length > 0);
});
