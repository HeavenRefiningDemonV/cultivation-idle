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
// M.I.1 — the combat-read engine (the exact functions gameStore.calculatePlayerStats consumes), so
// the parity test below can prove the constellation reads the SAME computeDerivedStats output combat
// fights with, sourced from ONE input — not a parallel computation.
import {
  computeDerivedStats,
  type DerivedStatInput,
} from '../../src/systems/meridians/derivedStats.js';
import { toDerivedStatInput } from '../../src/systems/meridians/derivedStatInput.js';
import { toObservatoryConstellationInput } from '../../src/systems/meridians/observatoryConstellationInput.js';
import {
  GEO_CALIBRATION,
  calibrateGeoBase,
  deriveLegacyCombatStats,
} from '../../src/systems/meridians/combatStatBridge.js';

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

  // Tier-2 derived: physAttack -> weapon_intent. M.I.1b — bounded PERCENT-OF-PEAK standing, not a bare
  // magnitude. physAttack (120) is the peak martial channel in this fixture, so weapon_intent reads 100% of
  // peak with cap 100; its copy reads as a relative standing, never a combat total.
  assert.equal(byId.get('weapon_intent')?.currentRating, 100);
  assert.equal(byId.get('weapon_intent')?.cap, 100);
  assert.equal(byId.get('weapon_intent')?.nodeState, 'lit');
  assert.equal(byId.get('weapon_intent')?.tone, 'gold');
  assert.equal(byId.get('weapon_intent')?.displayName, DERIVED_STAT_DISPLAY.physAttack.label);
  assert.match(byId.get('weapon_intent')?.effectSummary ?? '', /peak|not a combat total/i);
  // a NON-peak martial node reads as a bounded percent-of-peak standing (accuracy 88 / peak 120 = 73%).
  assert.equal(byId.get('precision')?.currentRating, Math.round((88 / 120) * 100));
  assert.equal(byId.get('precision')?.cap, 100);
  assert.match(byId.get('precision')?.effectSummary ?? '', /% of your peak|not a combat total/i);

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

test('M.I.1 source-parity — the constellation surfaces a percent-of-peak SHAPE of the SAME computeDerivedStats output combat GEO derives from (one input, no fork)', () => {
  // The anti-drift guarantee (§10): the Observatory and combat consume ONE engine on ONE input — not a
  // parallel computation. gameStore.calculatePlayerStats() (the F1 branch) sources its GEO base from
  // `calibrateGeoBase(deriveLegacyCombatStats(computeDerivedStats(toDerivedStatInput(), {})))`.
  //
  // M.I.1b — the 7 Tier-2 martial nodes are a BOUNDED percent-of-peak STANDING (role/shape axis, D2
  // anti-funnel): each is its derived channel as a fraction of the cultivator's strongest martial channel,
  // 0..100. They are a SHAPE readout, never a combat magnitude — the Vitals Ribbon owns the literal fight
  // number. Per-instrument parity (the corrected §19): SOURCE-parity here, VALUE-parity at the Vitals Ribbon.
  const input: DerivedStatInput = {
    foundation: { physique: 80, vitality: 90, agility: 70, perception: 60, willpower: 75 },
    axes: {
      cultivationBase: 88,
      qiPool: 64,
      qiPurity: 52,
      meridianOpenness: 70,
      spiritualSense: 49,
      soulStrength: 58,
      daoComprehension: 41,
    },
    meridianRatings: { martial_sword_heart: 60 }, // a non-zero martial set, so the shape is well-defined
    realmIndex1to7: 3,
  };
  const derived = computeDerivedStats(input, {}); // the exact call combat makes

  const surface = buildMeridianConstellationSurface({
    currentPath: 'martial',
    axes: AXES,
    foundation: FOUNDATION,
    derived, // the same engine output combat's GEO base derives from — NOT a parallel computation
    realmCap: 100,
  });
  const byId = new Map(surface.nodes.map((node) => [node.id, node]));

  const MARTIAL_NODE_CHANNEL: Record<string, DerivedStatKey> = {
    weapon_intent: 'physAttack',
    battle_rhythm: 'attackSpeed',
    flow_step: 'speed',
    precision: 'accuracy',
    counter_sense: 'evasion',
    killing_momentum: 'critChance',
    weapon_bond: 'armorPen',
  };
  const peak = Math.max(...Object.values(MARTIAL_NODE_CHANNEL).map((ch) => derived[ch]));
  assert.ok(peak > 0, 'fixture yields a non-zero martial peak so the percent-of-peak shape is well-defined');

  // Each martial node is the BOUNDED percent-of-peak standing of its derived channel — faithful to the same
  // engine output (no fork), and never a bare magnitude (cap 100, value in 0..100).
  for (const [nodeId, channel] of Object.entries(MARTIAL_NODE_CHANNEL)) {
    assert.equal(
      byId.get(nodeId)?.currentRating,
      Math.round((derived[channel] / peak) * 100),
      `${nodeId} must be the percent-of-peak standing of derived ${channel}`,
    );
    assert.equal(byId.get(nodeId)?.cap, 100, `${nodeId} is a bounded standing, not a magnitude`);
    const rating = byId.get(nodeId)?.currentRating ?? -1;
    assert.ok(rating >= 0 && rating <= 100, `${nodeId} standing is within 0..100`);
  }

  // Combat consumes the SAME engine output (one source): its GEO atk is the derived.physAttack channel run
  // through GEO_CALIBRATION — a distinct SCALE the Vitals Ribbon owns, NOT the constellation. This documents
  // the per-instrument split honestly rather than asserting a false node==combat-fight equality.
  const combatAtk = Number(calibrateGeoBase(deriveLegacyCombatStats(derived)).atk);
  assert.ok(
    Math.abs(combatAtk - derived.physAttack * GEO_CALIBRATION.atk) < 1e-9,
    'combat GEO atk = derived.physAttack x GEO_CALIBRATION.atk (same source, combat scale)',
  );
});

test('M.I.1b — an all-zero martial set reads as 0 standing (divide-by-zero guard), never 100', () => {
  // Fresh / locked cultivator: every martial channel is 0, so martialPeak is 0. The guard must render every
  // martial node dim (0), never a spurious 100 from a 0/0.
  const surface = buildMeridianConstellationSurface({ ...INPUT, derived: {} });
  const martial = surface.nodes.filter((node) => node.branchId === 'martial');
  assert.equal(martial.length, 7);
  for (const node of martial) {
    assert.equal(node.currentRating, 0, `${node.id} standing is 0 when no martial channel has value`);
    assert.equal(node.cap, 100);
    assert.equal(node.nodeState, 'lit');
  }
});

test('M.I.1 live seam — toObservatoryConstellationInput().derived equals computeDerivedStats(toDerivedStatInput()) (no parallel computation)', () => {
  // The LIVE input the Observatory feeds the binding must be the exact engine call combat consumes:
  // gameStore.calculatePlayerStats() reads computeDerivedStats(toDerivedStatInput(), {}). Lock that the seam
  // reads the same input, so a regression (a stray gear arg, a different realm source, a stale read) is
  // caught even though the dev-off flag keeps the surface builder's derived branch out of node:test.
  const expected = computeDerivedStats(toDerivedStatInput(), {});
  const seam = toObservatoryConstellationInput();
  assert.deepEqual(seam.derived, expected);
});
