import assert from 'node:assert/strict';
import test from 'node:test';

import { setDerivedStatInputGetter, useGameStore } from '../../src/stores/gameStore.js';
import { useEquipmentStore } from '../../src/stores/equipmentStore.js';
import type { DerivedStatInput } from '../../src/systems/meridians/derivedStats.js';

/**
 * M.III.1 EQ-MECH / S2 — the de-dup proof for the gear wire. Drives gameStore.calculatePlayerStats under
 * the statEngine runtime flag (which reads window.location.search) with the REFERENCE cultivator (all
 * shared ratings = 100), so the derived GEO base reproduces the realm row (SA-A2 parity) and the only
 * difference between branches is WHERE the gear multiplier is applied — proving it is applied exactly once.
 */

// the stat-engine flag reads window.location.search — provide a mutable window for this isolated test file.
const W = { location: { search: '' }, localStorage: { getItem: () => null, setItem: () => {} } };
(globalThis as unknown as { window: typeof W }).window = W;
const setFlags = (search: string) => {
  W.location.search = search;
};

const REALM_INDEX = 2; // realm 3 (0-indexed) — inside the live semester slice
const refInput = (): DerivedStatInput => ({
  foundation: { physique: 100, vitality: 100, agility: 100, perception: 100, willpower: 100 },
  axes: {
    cultivationBase: 100, qiPool: 100, qiPurity: 100, meridianOpenness: 100,
    spiritualSense: 100, soulStrength: 100, daoComprehension: 100,
  },
  meridianRatings: {},
  realmIndex1to7: REALM_INDEX + 1,
});
setDerivedStatInputGetter(refInput);

// refine 5 (×1.10, capped well under 1.25) + atkPct 5% temper ⇒ a physAttack multiplier of 1.10 × 1.05 = 1.155.
const EXPECTED_WEAPON_MULT = 1.155;

const equip = (equipped: boolean) => {
  useEquipmentStore.setState((s) => {
    s.equippedWeaponId = equipped ? 'demo_cinnabar_sabre' : null;
    s.equippedAccessoryId = null;
    s.refineLevelBySlot.weapon = equipped ? 5 : 0;
    s.refineLevelBySlot.accessory = 0;
    s.temperBonusesBySlot.weapon = equipped ? [{ id: 't1', label: 'Sharpened', stat: 'atkPct', valuePct: 0.05 }] : [];
    s.temperBonusesBySlot.accessory = [];
  });
};

const statsFor = (search: string, equipped: boolean) => {
  setFlags(search);
  useGameStore.getState().hardResetGameState();
  useGameStore.setState((s) => {
    s.realm.index = REALM_INDEX;
  });
  equip(equipped);
  useGameStore.getState().calculatePlayerStats();
  const st = useGameStore.getState().stats;
  return { atk: Number(st.atk), hp: Number(st.maxHp), def: Number(st.def), regen: Number(st.regen), crit: st.crit, dodge: st.dodge };
};

const approxRatio = (got: number, base: number, want: number, label: string) =>
  assert.ok(Math.abs(got / base - want) < 1e-6, `${label}: got ×${(got / base).toFixed(6)}, want ×${want}`);
const approxEqual = (got: number, want: number, label: string) =>
  assert.ok(Math.abs(got - want) / Math.max(1, want) < 1e-3, `${label}: got ${got}, want ${want}`);

test('S2 parity-safe identity: flag-on with nothing equipped equals flag-off nothing-equipped (composeGear {} ⇒ ×1)', () => {
  const on = statsFor('?statEngine=1', false);
  const off = statsFor('', false);
  approxEqual(on.atk, off.atk, 'atk');
  approxEqual(on.hp, off.hp, 'hp');
  approxEqual(on.def, off.def, 'def');
  approxEqual(on.regen, off.regen, 'regen');
});

test('S2 single-count: flag-on, one weapon (refine 5 + atkPct 5%) raises atk by EXACTLY ×1.155 — not ×1.155² (no double-count)', () => {
  const base = statsFor('?statEngine=1', false).atk;
  const geared = statsFor('?statEngine=1', true).atk;
  approxRatio(geared, base, EXPECTED_WEAPON_MULT, 'flag-on weapon atk');
  // the double-count bug would produce ~1.334 (1.155²); assert we are nowhere near it
  assert.ok(geared / base < 1.2, `single-count: ratio ${(geared / base).toFixed(4)} must be ~1.155, not ~1.334`);
});

test('S2 branch agreement: the same equipped state yields equal atk/hp/def/regen flag-on vs flag-off (the wire moved WHERE gear applies, not how much)', () => {
  const on = statsFor('?statEngine=1', true);
  const off = statsFor('', true);
  approxEqual(on.atk, off.atk, 'atk');
  approxEqual(on.hp, off.hp, 'hp');
  approxEqual(on.def, off.def, 'def');
  approxEqual(on.regen, off.regen, 'regen');
  // the GEO-only gate keeps the additive crit/dodge temper in BOTH branches, so the GENTLE channels agree too
  approxEqual(on.crit, off.crit, 'crit');
  approxEqual(on.dodge, off.dodge, 'dodge');
});

test('S2 forceLegacy always wins: ?statEngine=1&forceLegacy=1 suppresses the derived gear and runs the legacy stack (== flag-off)', () => {
  const forced = statsFor('?statEngine=1&forceLegacy=1', true);
  const off = statsFor('', true);
  approxEqual(forced.atk, off.atk, 'atk');
  approxEqual(forced.hp, off.hp, 'hp');
  approxEqual(forced.def, off.def, 'def');
});

test('S2 GEO-only gate — DUAL proof: atkPct de-dupes (×1.155, not ×1.334) WHILE the additive crit/dodge temper is KEPT (+5, not vanished)', () => {
  // One equipped state carrying BOTH a GEO temper (atkPct — gated, must de-dupe) and two GENTLE tempers
  // (critPct/dodgePct — ungated, must survive). This exercises BOTH halves of the gate AT ONCE: the
  // skip-block (atkPct counts exactly once) and the keep-path (crit/dodge additive survives the derived
  // branch). A "skip the whole legacy stack" bug fails the crit/dodge +5; a "no gate at all" bug fails the
  // atk de-dup (it would read ×1.334). critPct alone could not catch the former — it is ungated by design.
  const withMixedGear = (search: string, geared: boolean) => {
    setFlags(search);
    useGameStore.getState().hardResetGameState();
    useGameStore.setState((s) => {
      s.realm.index = REALM_INDEX;
    });
    useEquipmentStore.setState((s) => {
      s.equippedWeaponId = 'demo_cinnabar_sabre';
      s.equippedAccessoryId = null;
      s.refineLevelBySlot.weapon = geared ? 5 : 0;
      s.refineLevelBySlot.accessory = 0;
      s.temperBonusesBySlot.weapon = geared
        ? [
            { id: 'ta', label: 'Sharpened', stat: 'atkPct', valuePct: 0.05 },
            { id: 'tc', label: 'Keen', stat: 'critPct', valuePct: 0.05 },
            { id: 'td', label: 'Lithe', stat: 'dodgePct', valuePct: 0.05 },
          ]
        : [];
      s.temperBonusesBySlot.accessory = [];
    });
    useGameStore.getState().calculatePlayerStats();
    const st = useGameStore.getState().stats;
    return { atk: Number(st.atk), crit: st.crit, dodge: st.dodge };
  };

  const base = withMixedGear('?statEngine=1', false); // flag-on, nothing equipped
  const on = withMixedGear('?statEngine=1', true); // flag-on, atkPct + critPct + dodgePct
  const off = withMixedGear('', true); // flag-off, same gear

  // GEO half — the gate SKIPPED the legacy refine/atkPct multiply: atk rose ×1.155 ONCE, not ×1.155² (≈1.334).
  approxRatio(on.atk, base.atk, EXPECTED_WEAPON_MULT, 'flag-on atk de-dup');
  // GENTLE half — the additive crit/dodge temper is KEPT under the derived branch (rose by EXACTLY +5).
  // composeGear's multiplicative critChance/evasion were computed-then-DISCARDED by the GEO carve-out, so a
  // delta of exactly 5 also proves no multiplicative crit/dodge leaked through.
  assert.ok(on.crit > base.crit && on.dodge > base.dodge, 'gear crit/dodge did NOT vanish under the derived path');
  assert.ok(Math.abs((on.crit - base.crit) - 5) < 1e-9, `crit rose by the additive 5, got +${on.crit - base.crit}`);
  assert.ok(Math.abs((on.dodge - base.dodge) - 5) < 1e-9, `dodge rose by the additive 5, got +${on.dodge - base.dodge}`);
  // branch agreement across BOTH channel kinds — the gate moved WHERE atk applies and KEEPS crit/dodge, equally.
  approxEqual(on.atk, off.atk, 'atk flag-on == flag-off');
  assert.ok(Math.abs(on.crit - off.crit) < 1e-9, 'crit flag-on == flag-off (additive temper kept in both branches)');
  assert.ok(Math.abs(on.dodge - off.dodge) < 1e-9, 'dodge flag-on == flag-off');
});
