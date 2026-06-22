import assert from 'node:assert/strict';
import test from 'node:test';

import {
  resolvePathMeridianDrip,
  revealNextPathMeridian,
} from '../../src/systems/cultivation/cultivationPathIdentityResolver.js';
import { getOrderedLiveRealms } from '../../src/systems/progression/runtime/liveRealmProjection.js';

const LIVE_CAP_INDEX = getOrderedLiveRealms().length - 1; // 5 (spirit_severing)

void test('M.II.1-B — a major breakthrough reveals exactly one new path meridian (sealed-future → unlocked-bright)', () => {
  // Qi Condensation (realm 0) → Foundation Establishment (realm 1) reveals slot 2.
  const before = resolvePathMeridianDrip('heaven', 0);
  const after = resolvePathMeridianDrip('heaven', 1);

  assert.equal(after.unlockedCount, before.unlockedCount + 1, 'exactly one more meridian is revealed');

  const reveal = revealNextPathMeridian('heaven', 1);
  assert.equal(reveal?.meridianId, 'heaven_mind_eye', 'slot 2 is the Foundation reveal');
  assert.equal(reveal?.pathId, 'heaven');

  const slot2 = after.slips.find((s) => s.slot === 2);
  const slot1 = after.slips.find((s) => s.slot === 1);
  assert.equal(slot2?.state, 'unlocked-bright', 'the newly revealed slip is bright');
  assert.equal(slot1?.state, 'idle-dim', 'the previously-current slip relaxes to dim');
  assert.equal(after.slips.filter((s) => s.isNextToUnlock).length, 1, 'exactly one slip is next-to-unlock');
  assert.equal(slot2?.revealedAtRealmIndex, 1);
});

void test('M.II.1-B — exactly one meridian reveals per major breakthrough across the live six-realm slice', () => {
  for (let realmIndex = 1; realmIndex <= LIVE_CAP_INDEX; realmIndex++) {
    const reveal = revealNextPathMeridian('martial', realmIndex);
    assert.ok(reveal, `realm ${realmIndex} reveals a meridian`);

    const before = resolvePathMeridianDrip('martial', realmIndex - 1).unlockedCount;
    const after = resolvePathMeridianDrip('martial', realmIndex);
    assert.equal(after.unlockedCount, before + 1, `one reveal at realm ${realmIndex}`);
    assert.equal(
      reveal?.meridianId,
      after.slips.find((s) => s.slot === realmIndex + 1)?.meridianId,
      'the reveal matches the slip revealed at this realm',
    );
  }
});

void test('M.II.1-B — capstone-sealed-at-cap: slot 7 stays sealed at the semester cap', () => {
  for (const path of ['heaven', 'earth', 'martial'] as const) {
    const atCap = resolvePathMeridianDrip(path, LIVE_CAP_INDEX);
    assert.equal(atCap.unlockedCount, 6, `${path} reveals slots 1..6 across the live slice`);

    const capstone = atCap.slips.find((s) => s.slot === 7);
    assert.equal(capstone?.state, 'sealed-future', `${path} capstone is sealed`);
    assert.equal(capstone?.isNextToUnlock, false, `${path} capstone is never next-to-unlock at cap`);
    assert.equal(atCap.nextRevealMeridianId, null, `${path} has no next reveal at cap`);

    // Reaching the cap reveals slot 6 (not the capstone); a realm beyond the cap never resolves.
    assert.equal(
      revealNextPathMeridian(path, LIVE_CAP_INDEX)?.meridianId,
      atCap.slips.find((s) => s.slot === 6)?.meridianId,
      `${path} reveals its sixth slip on reaching the cap`,
    );
    assert.equal(revealNextPathMeridian(path, LIVE_CAP_INDEX + 1), null, 'no seventh-realm reveal exists');
  }
});

void test('M.II.1-B — no path selected ⇒ empty drip, no reveal (additive, never crashes)', () => {
  const drip = resolvePathMeridianDrip(null, 2);
  assert.equal(drip.pathId, null);
  assert.equal(drip.slips.length, 0);
  assert.equal(drip.unlockedCount, 0);
  assert.equal(drip.nextRevealMeridianId, null);
  assert.equal(revealNextPathMeridian(null, 2), null);
});
