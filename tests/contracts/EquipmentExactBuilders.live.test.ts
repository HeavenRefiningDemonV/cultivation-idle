import assert from 'node:assert/strict';
import test from 'node:test';

import { GEAR_ITEM_DEFS } from '../../src/content/gearItems.js';
import { composeGear } from '../../src/systems/equipment/equipmentGearResolver.js';
import type { GearInstance, ItemDef } from '../../src/systems/equipment/gearModel.js';
import type { Loadout } from '../../src/systems/equipment/gearLoadout.js';
import { ITEM_DETAIL_SCHEMA_VERSION } from '../../src/systems/ui/modals/index.js';
import {
  PANOPLY_EXACT_SCHEMA_VERSION,
  VAULT_EXACT_SCHEMA_VERSION,
  buildPanoplyExactSurface,
  buildVaultExactSurface,
} from '../../src/systems/ui/equipment/index.js';

/**
 * M.III.1 EQ-MECH / S3 — the LIVE builders, proven from the GEAR_ITEM_DEFS registry. Render-only,
 * pure (same input ⇒ same surface), the totals panel == composeGear's output, every magnitude HELD.
 */

const getDef = (defId: string): ItemDef | undefined => GEAR_ITEM_DEFS.find((d) => d.id === defId);
const gi = (instanceId: string, defId: string, rarity: GearInstance['rarity']): GearInstance =>
  ({ instanceId, defId, rarity, affixes: [] });

const WEAPON = gi('gi-w1', 'demo_cinnabar_sabre', 'epic');
const HEAD = gi('gi-h1', 'demo_stoneforged_helm', 'rare');
const CHEST = gi('gi-c1', 'demo_stoneforged_cuirass', 'rare');
const LEGS = gi('gi-l1', 'demo_stoneforged_greaves', 'rare');
const ACCESSORY = gi('gi-a1', 'demo_foresight_pendant', 'common');

const FULL_LOADOUT: Loadout = { weapon: WEAPON, head: HEAD, chest: CHEST, legs: LEGS, accessories: [ACCESSORY] };
const EMPTY_LOADOUT: Loadout = { weapon: null, head: null, chest: null, legs: null, accessories: [] };

// composeGear's real output for a refined+tempered weapon — the totals panel reads THIS, never recomputes.
const GEAR_TOTALS = composeGear({
  equippedWeaponId: 'w',
  equippedAccessoryId: null,
  refineLevelBySlot: { weapon: 5, accessory: 0 },
  temperBonusesBySlot: { weapon: [{ stat: 'atkPct', valuePct: 0.05 }], accessory: [] },
});

const assertNoFunctions = (value: unknown, path: string): void => {
  if (typeof value === 'function') throw new Error(`render-only violation at ${path}`);
  if (Array.isArray(value)) value.forEach((v, i) => assertNoFunctions(v, `${path}[${i}]`));
  else if (value && typeof value === 'object') {
    for (const [k, v] of Object.entries(value)) assertNoFunctions(v, `${path}.${k}`);
  }
};

// ── Panoply ──────────────────────────────────────────────────────────────────────────────────────

test('S3 Panoply: a populated loadout builds a healthy surface with all five slot kinds filled', () => {
  const s = buildPanoplyExactSurface({ loadout: FULL_LOADOUT, getDef, gearTotals: GEAR_TOTALS, path: 'martial', realm: 2 });
  assert.equal(s.schemaVersion, PANOPLY_EXACT_SCHEMA_VERSION);
  assert.equal(s.visualState, 'healthy');
  const weaponSlot = s.slots.find((slot) => slot.slot === 'weapon');
  assert.equal(weaponSlot?.filled, true);
  assert.equal(weaponSlot?.item?.name, 'Cinnabar-Vein Sabre');
  for (const kind of ['head', 'chest', 'legs'] as const) {
    assert.equal(s.slots.find((slot) => slot.slot === kind)?.filled, true, `${kind} filled`);
  }
  assert.ok(s.slots.some((slot) => slot.slot === 'accessory' && slot.filled), 'an accessory slot is filled');
});

test('S3 Panoply: the totals panel equals composeGear output (physAttack gain), never recomputed', () => {
  const s = buildPanoplyExactSurface({ loadout: FULL_LOADOUT, getDef, gearTotals: GEAR_TOTALS, path: 'martial', realm: 2 });
  const row = s.totals.offense.find((r) => r.channel === 'physAttack');
  assert.ok(row, 'physAttack is an offense row');
  assert.equal(row?.tone, 'gain');
  assert.ok(row?.addText.startsWith('×1.1'), `addText reflects the multiplier, got ${row?.addText}`);
  // nothing equipped on the legacy path ⇒ composeGear {} ⇒ no rows (parity-safe identity at the surface)
  const bare = buildPanoplyExactSurface({ loadout: EMPTY_LOADOUT, getDef, gearTotals: {}, path: 'earth', realm: 2 });
  assert.equal(bare.totals.offense.length + bare.totals.defense.length + bare.totals.utility.length, 0);
});

test('S3 Panoply: a Martial weapon shows a bond; a non-Martial path shows bond:null (never a stub)', () => {
  const martial = buildPanoplyExactSurface({ loadout: FULL_LOADOUT, getDef, gearTotals: GEAR_TOTALS, path: 'martial', realm: 2 });
  assert.ok(martial.bond, 'martial bond present');
  assert.equal(martial.bond?.level, 0, 'bond depth HELD at 0');
  const heaven = buildPanoplyExactSurface({ loadout: FULL_LOADOUT, getDef, gearTotals: GEAR_TOTALS, path: 'heaven', realm: 2 });
  assert.equal(heaven.bond, null, 'non-Martial ⇒ bond null');
});

test('S3 Panoply: the three Stoneforged pieces resolve a set band, held=3, inactive while thresholds HELD', () => {
  const s = buildPanoplyExactSurface({ loadout: FULL_LOADOUT, getDef, gearTotals: GEAR_TOTALS, path: 'earth', realm: 2 });
  const band = s.setBonuses.find((b) => b.setId === 'stoneforged');
  assert.ok(band, 'stoneforged set band present');
  assert.equal(band?.held, 3);
  assert.equal(band?.activeTier, null, 'set thresholds HELD ⇒ honestly inactive');
});

test('S3 Panoply: a selected instance fills a valid F2 selectedDetail and flips visualState to detail-*', () => {
  const s = buildPanoplyExactSurface({ loadout: FULL_LOADOUT, getDef, gearTotals: GEAR_TOTALS, path: 'martial', realm: 2, selectedInstanceId: 'gi-w1' });
  assert.equal(s.selectedDetail?.schemaVersion, ITEM_DETAIL_SCHEMA_VERSION);
  assert.equal(s.selectedDetail?.identity?.name, 'Cinnabar-Vein Sabre');
  assert.equal(s.visualState, 'detail-affix'); // epic, not legendary
});

test('S3 Panoply: an empty loadout is visualState empty with no bond and no functions anywhere', () => {
  const s = buildPanoplyExactSurface({ loadout: EMPTY_LOADOUT, getDef, gearTotals: {}, path: 'earth', realm: 2 });
  assert.equal(s.visualState, 'empty');
  assert.equal(s.bond, null);
  assertNoFunctions(s, 'panoply');
});

// ── Vault ────────────────────────────────────────────────────────────────────────────────────────

const VAULT_INSTANCES: Record<string, GearInstance> = {
  'gi-w1': WEAPON,
  'gi-h1': HEAD,
  'gi-a1': ACCESSORY,
  'gi-leg-1': gi('gi-leg-1', 'demo_cinnabar_sabre', 'legendary'),
};

test('S3 Vault: held instances build a healthy surface with correct total + byRarity counts', () => {
  const s = buildVaultExactSurface({
    gearInstances: VAULT_INSTANCES, getDef, loadout: FULL_LOADOUT,
    filter: { slot: 'all', grade: 'all' }, sort: { by: 'rarity', dir: 'desc' },
  });
  assert.equal(s.schemaVersion, VAULT_EXACT_SCHEMA_VERSION);
  assert.equal(s.visualState, 'healthy');
  assert.equal(s.counts.total, 4);
  assert.equal(s.counts.byRarity.legendary, 1);
  assert.equal(s.counts.byRarity.epic, 1);
  assert.equal(s.counts.byRarity.rare, 1);
  assert.equal(s.counts.byRarity.common, 1);
});

test('S3 Vault: the slot filter narrows to weapons; equipped instances are flagged isEquipped', () => {
  const s = buildVaultExactSurface({
    gearInstances: VAULT_INSTANCES, getDef, loadout: FULL_LOADOUT,
    filter: { slot: 'weapon', grade: 'all' }, sort: { by: 'rarity', dir: 'desc' },
  });
  assert.ok(s.slips.length >= 1);
  assert.ok(s.slips.every((slip) => slip.slot === 'weapon'), 'only weapons after the weapon filter');
  assert.equal(s.slips.find((slip) => slip.instanceId === 'gi-w1')?.isEquipped, true, 'the worn weapon is flagged equipped');
});

test('S3 Vault: rarity-desc sort puts the legendary first', () => {
  const s = buildVaultExactSurface({
    gearInstances: VAULT_INSTANCES, getDef, loadout: EMPTY_LOADOUT,
    filter: { slot: 'all', grade: 'all' }, sort: { by: 'rarity', dir: 'desc' },
  });
  assert.equal(s.slips[0]?.rarity, 'legendary');
});

test('S3 Vault: selecting a slip fills selectedDetail + enables the confirm-gated dismantle', () => {
  const s = buildVaultExactSurface({
    gearInstances: VAULT_INSTANCES, getDef, loadout: EMPTY_LOADOUT,
    filter: { slot: 'all', grade: 'all' }, sort: { by: 'rarity', dir: 'desc' }, selectedInstanceId: 'gi-leg-1',
  });
  assert.equal(s.selection.instanceId, 'gi-leg-1');
  assert.equal(s.selectedDetail?.schemaVersion, ITEM_DETAIL_SCHEMA_VERSION);
  assert.equal(s.visualState, 'detail-legendary');
  assert.equal(s.dismantle?.enabled, true);
  assert.ok((s.dismantle?.confirmPrompt ?? '').length > 0);
});

test('S3 Vault: an empty vault is visualState empty with total 0 and no functions anywhere', () => {
  const s = buildVaultExactSurface({
    gearInstances: {}, getDef, loadout: EMPTY_LOADOUT,
    filter: { slot: 'all', grade: 'all' }, sort: { by: 'recent', dir: 'desc' },
  });
  assert.equal(s.visualState, 'empty');
  assert.equal(s.counts.total, 0);
  assert.equal(s.dismantle, null);
  assertNoFunctions(s, 'vault');
});
