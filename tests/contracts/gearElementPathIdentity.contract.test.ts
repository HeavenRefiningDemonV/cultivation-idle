import assert from 'node:assert/strict';
import test from 'node:test';

import type { GearInstance } from '../../src/systems/equipment/gearModel.js';
import type { Loadout } from '../../src/systems/equipment/gearLoadout.js';
import { isGearAffinityInert, toGearAffinity } from '../../src/systems/equipment/gearElementContribution.js';
import { resolvePathIdentity } from '../../src/systems/ui/equipment/index.js';
import { PANOPLY_PATH_LEAN_OPTIONS } from '../../src/systems/ui/equipment/index.js';

/**
 * M.III.1 EQ-MECH / S5 — the element-vector seam (inert while payloads null) and the per-path identity
 * (the three paths read distinctly). Both pure, shape-only, magnitude-HELD.
 */

const gi = (instanceId: string, payload?: string | null): GearInstance =>
  ({ instanceId, defId: 'demo_cinnabar_sabre', rarity: 'common', affixes: [], elementPayload: payload ?? null });

const loadoutOf = (weapon: GearInstance | null, accessories: GearInstance[] = []): Loadout =>
  ({ weapon, head: null, chest: null, legs: null, accessories });

test('S5 element seam: a loadout with no element payloads yields an INERT (empty) affinity vector', () => {
  const vector = toGearAffinity(loadoutOf(gi('w1', null), [gi('a1', null)]));
  assert.deepEqual(vector, {});
  assert.equal(isGearAffinityInert(vector), true);
});

test('S5 element seam: once a piece carries an elementPayload it tallies (structural count; weight HELD)', () => {
  const vector = toGearAffinity(loadoutOf(gi('w1', 'fire'), [gi('a1', 'fire'), gi('a2', 'water')]));
  assert.equal(vector.fire, 2);
  assert.equal(vector.water, 1);
  assert.equal(isGearAffinityInert(vector), false);
});

test('S5 per-path identity: the three paths read DISTINCTLY (different lead slot per path)', () => {
  const martial = resolvePathIdentity('martial');
  const earth = resolvePathIdentity('earth');
  const heaven = resolvePathIdentity('heaven');
  assert.equal(martial.emphasis.weapon, 'lead');
  assert.equal(earth.emphasis.armor, 'lead');
  assert.equal(heaven.emphasis.accessory, 'lead');
  // pairwise distinct emphasis maps
  assert.notDeepEqual(martial.emphasis, earth.emphasis);
  assert.notDeepEqual(earth.emphasis, heaven.emphasis);
  assert.notDeepEqual(martial.emphasis, heaven.emphasis);
});

test('S5 per-path identity: total over every path lean, each headline distinct, emphasis is lens-only', () => {
  const headlines = new Set<string>();
  for (const path of PANOPLY_PATH_LEAN_OPTIONS) {
    const identity = resolvePathIdentity(path);
    assert.equal(identity.path, path);
    assert.ok(identity.headline.length > 0);
    headlines.add(identity.headline);
    // exactly one lead among the three slot families (emphasis, never geometry)
    const values = Object.values(identity.emphasis);
    assert.equal(values.filter((e) => e === 'lead').length, 1, `${path} has exactly one lead`);
  }
  assert.equal(headlines.size, PANOPLY_PATH_LEAN_OPTIONS.length, 'every path headline is distinct');
});
