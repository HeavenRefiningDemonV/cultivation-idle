import assert from 'node:assert/strict';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import test from 'node:test';

import type { PathMeridianDef, PathMeridiansConfig } from '../../src/content/types.js';
import {
  MERIDIAN_COUNT_PER_PATH,
  MERIDIAN_REALM_CAPS,
  MERIDIAN_ROOTS,
  SPIRIT_ROOT_GRADES,
  effectiveMeridianCap,
} from '../../src/systems/meridians/index.js';

/**
 * W2 — Three Treasures data model. The 21-meridian content pack + roots + the
 * 7-realm cap ladder. (jsdom-irrelevant: pure data-shape contracts.)
 */

const PATHS = ['martial', 'earth', 'heaven'] as const;

async function loadPack(): Promise<PathMeridiansConfig> {
  const file = path.resolve(
    process.cwd(),
    'public',
    'cultivation_idle_content_bible_v1_config',
    'path_meridians.json',
  );
  return JSON.parse(await fs.readFile(file, 'utf8')) as PathMeridiansConfig;
}

function byPath(meridians: PathMeridianDef[], pathId: string): PathMeridianDef[] {
  return meridians
    .filter((meridian) => meridian.path === pathId)
    .slice()
    .sort((a, b) => a.unlockRealm - b.unlockRealm);
}

test('path_meridians pack defines 21 meridians, 7 per path, unique ids', async () => {
  const pack = await loadPack();
  assert.equal(pack.meridians.length, 21, 'expected 21 path meridians');
  const ids = new Set(pack.meridians.map((meridian) => meridian.id));
  assert.equal(ids.size, 21, 'meridian ids must be unique');
  for (const pathId of PATHS) {
    assert.equal(byPath(pack.meridians, pathId).length, MERIDIAN_COUNT_PER_PATH, `${pathId} must have 7 meridians`);
  }
});

test('each path drips one meridian per realm 1..7 (signature=1, capstone Dao=7)', async () => {
  const pack = await loadPack();
  for (const pathId of PATHS) {
    const ordered = byPath(pack.meridians, pathId);
    ordered.forEach((meridian, index) => {
      // N2: unlockRealm is exactly index+1 in unlock order (drip cadence).
      assert.equal(meridian.unlockRealm, index + 1, `${pathId}[${index}] unlockRealm must be ${index + 1}`);
    });
    assert.equal(ordered[0].unlockRealm, 1, `${pathId} signature unlocks at realm 1`);
    assert.equal(ordered[6].unlockRealm, 7, `${pathId} capstone Dao unlocks at realm 7`);
  }
});

test('signature ids are path-namespaced (Earth=Body Temper; Heaven Spirit Sense distinct from Tier-1)', async () => {
  const pack = await loadPack();
  // C.5 fix: Earth signature is Body Temper (not Bone Forging).
  assert.equal(byPath(pack.meridians, 'earth')[0].id, 'earth_body_temper');
  assert.equal(byPath(pack.meridians, 'martial')[0].id, 'martial_weapon_intent');
  assert.equal(byPath(pack.meridians, 'heaven')[0].id, 'heaven_spirit_sense');
  // The 神识 collision is resolved by namespacing: the Heaven Tier-2 meridian id is
  // 'heaven_spirit_sense', distinct from any Tier-1 'spirit_sense'-style stat id.
  for (const meridian of pack.meridians) {
    assert.ok(meridian.id.startsWith(`${meridian.path}_`), `${meridian.id} must be path-namespaced`);
  }
});

test('realm cap ladder is the 7-tuple ending at the sanctioned R7=170', () => {
  assert.equal(MERIDIAN_REALM_CAPS.length, 7);
  assert.equal(MERIDIAN_REALM_CAPS[6], 170);
  assert.deepEqual([...MERIDIAN_REALM_CAPS], [40, 60, 80, 100, 125, 150, 170]);
});

test('spirit-root grades scale the cap: Heavenly caps higher than Mortal at the same realm', () => {
  assert.equal(SPIRIT_ROOT_GRADES.length, 5);
  for (const grade of SPIRIT_ROOT_GRADES) {
    assert.ok(MERIDIAN_ROOTS[grade], `missing root def for ${grade}`);
  }
  // N4: cap = round(CAPS[realm] × root.capMult); Heavenly > Mortal at the same realm.
  assert.ok(effectiveMeridianCap(7, 'heavenly') > effectiveMeridianCap(7, 'mortal'));
  assert.equal(effectiveMeridianCap(1, 'mortal'), Math.round(40 * 0.9));
  assert.equal(effectiveMeridianCap(7, 'heavenly'), Math.round(170 * 1.6));
});
