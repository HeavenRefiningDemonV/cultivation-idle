import assert from 'node:assert/strict';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import test from 'node:test';

import type { PathMeridiansConfig } from '../../src/content/types.js';
import {
  DERIVED_STAT_DISPLAY,
  DERIVED_STAT_KEYS,
  MERIDIAN_DERIVED_MAP,
  computeDerivedStats,
  derivedRealmScalar,
  meridianDerivedTargets,
  meridianSignatureEffects,
  type AxisKey,
  type DerivedStatInput,
  type FoundationKey,
} from '../../src/systems/meridians/index.js';

/**
 * W4 — Tier-3 derived-stat layer. Computed from Tiers 0/1/2 (never trained directly),
 * with the meridian→derived mapping shared between the resolver and the codex chips.
 */

const FOUNDATION: Record<FoundationKey, number> = { physique: 0, vitality: 0, agility: 0, perception: 0, willpower: 0 };
const AXES: Record<AxisKey, number> = {
  cultivationBase: 0,
  qiPool: 0,
  qiPurity: 0,
  meridianOpenness: 0,
  spiritualSense: 0,
  soulStrength: 0,
  daoComprehension: 0,
};

function input(overrides: Partial<DerivedStatInput> = {}): DerivedStatInput {
  return { foundation: { ...FOUNDATION }, axes: { ...AXES }, meridianRatings: {}, realmIndex1to7: 4, ...overrides };
}

async function loadPack(): Promise<PathMeridiansConfig> {
  const file = path.resolve(process.cwd(), 'public', 'cultivation_idle_content_bible_v1_config', 'path_meridians.json');
  return JSON.parse(await fs.readFile(file, 'utf8')) as PathMeridiansConfig;
}

test('N11: derived stats are computed (deterministic, recomputed not stored)', () => {
  const a = computeDerivedStats(input());
  const b = computeDerivedStats(input());
  assert.deepEqual(a, b, 'same input → same output');
  // Mutating a result never feeds back: a fresh compute is unchanged.
  a.maxHp = 999_999;
  assert.notEqual(computeDerivedStats(input()).maxHp, 999_999);
  assert.equal(DERIVED_STAT_KEYS.length, 21);
});

test('a meridian rating changes its derived channel and not unrelated ones', () => {
  const base = computeDerivedStats(input());
  const withWeaponIntent = computeDerivedStats(input({ meridianRatings: { martial_weapon_intent: 100 } }));
  assert.ok(withWeaponIntent.physAttack > base.physAttack, 'Weapon Intent must raise Physical Attack');
  assert.equal(withWeaponIntent.soulDefense, base.soulDefense, 'Weapon Intent must not touch Soul Defense');

  const withVoidGaze = computeDerivedStats(input({ meridianRatings: { heaven_void_gaze: 100 } }));
  assert.ok(withVoidGaze.soulAttack > base.soulAttack, 'Void Gaze must raise Soul Attack');
  assert.equal(withVoidGaze.physAttack, base.physAttack, 'Void Gaze must not touch Physical Attack');
});

test('Tier-0/1 sources feed derived stats; realm scales them up', () => {
  const lowRealm = computeDerivedStats(input({ foundation: { ...FOUNDATION, vitality: 100 }, realmIndex1to7: 1 }));
  const highRealm = computeDerivedStats(input({ foundation: { ...FOUNDATION, vitality: 100 }, realmIndex1to7: 7 }));
  assert.ok(lowRealm.maxHp > 50, 'Vitality feeds Max HP');
  assert.ok(highRealm.maxHp > lowRealm.maxHp, 'higher realm scales derived stats up');
  assert.equal(derivedRealmScalar(1), 1);
  assert.ok(derivedRealmScalar(7) > derivedRealmScalar(1));
});

test('codex targets and resolver share one source: every pack meridian maps to valid channels', async () => {
  const pack = await loadPack();
  const validChannels = new Set<string>(DERIVED_STAT_KEYS);
  for (const meridian of pack.meridians) {
    const targets = meridianDerivedTargets(meridian.id);
    assert.ok(targets.length > 0, `${meridian.id} must feed at least one derived channel`);
    for (const target of targets) {
      assert.ok(validChannels.has(target.channel), `${meridian.id} → invalid channel ${target.channel}`);
      assert.ok(DERIVED_STAT_DISPLAY[target.channel], `channel ${target.channel} needs a codex display label`);
    }
    // The shared map is the same object the resolver consumes.
    assert.equal(targets, MERIDIAN_DERIVED_MAP[meridian.id]);
  }
});

test('signature path effects are produced as data/flags from meridian ratings', () => {
  const none = meridianSignatureEffects({});
  assert.equal(none.swordHeartDrIgnorePct, 0);
  assert.equal(none.ironSkinThreshold, 0);
  assert.equal(none.rootDepthRooted, false);
  assert.equal(none.capstones.asura, false);

  const armed = meridianSignatureEffects({
    martial_sword_heart: 50,
    earth_iron_skin: 40,
    earth_root_depth: 10,
    heaven_heavenly_mandate: 30,
    martial_dao_asura: 1,
  });
  assert.ok(armed.swordHeartDrIgnorePct > 0, 'Sword Heart yields a %DR-ignore flag');
  assert.ok(armed.ironSkinThreshold > 0, 'Iron Skin yields a damage threshold');
  assert.equal(armed.rootDepthRooted, true);
  assert.ok(armed.heavenlyMandateAuraPct > 0, 'Heavenly Mandate yields a suppression aura');
  assert.equal(armed.capstones.asura, true);
});
