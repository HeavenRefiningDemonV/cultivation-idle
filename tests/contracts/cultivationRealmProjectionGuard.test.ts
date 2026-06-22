import assert from 'node:assert/strict';
import test from 'node:test';

import {
  getOrderedLiveRealms,
  getNextLiveRealm,
  getSemesterCapRealm,
  isAtSemesterCap,
} from '../../src/systems/progression/runtime/liveRealmProjection.js';
import { resolvePathMeridianDrip } from '../../src/systems/cultivation/cultivationPathIdentityResolver.js';

void test('M.II.1 guard — realm identity comes from the live six-realm projection (no seventh realm)', () => {
  const realms = getOrderedLiveRealms();
  assert.equal(realms.length, 6, 'the live slice has exactly six realms');
  assert.equal(realms[4].id, 'soul_formation');
  assert.equal(realms[5].id, 'spirit_severing');
  assert.equal(getSemesterCapRealm().id, 'spirit_severing');
  assert.equal(isAtSemesterCap(5), true, 'spirit_severing is the semester cap');
  assert.equal(getNextLiveRealm(4)?.id, 'spirit_severing');
  assert.equal(getNextLiveRealm(5), null, 'there is no realm past spirit_severing');
});

void test('M.II.1 guard — the path capstone stays sealed at the cap (drip is keyed to the live projection)', () => {
  const capIndex = getOrderedLiveRealms().length - 1;
  for (const path of ['heaven', 'earth', 'martial'] as const) {
    const drip = resolvePathMeridianDrip(path, capIndex);
    const capstone = drip.slips.find((slip) => slip.slot === 7);
    assert.equal(drip.unlockedCount, 6, `${path} never reveals the seventh slip in the live slice`);
    assert.equal(capstone?.state, 'sealed-future');
    assert.equal(capstone?.isNextToUnlock, false);
    assert.equal(drip.nextRevealMeridianId, null);
  }
});
