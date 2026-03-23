import assert from 'node:assert/strict';
import test from 'node:test';

import {
  BASE_ACTIVE_SLOTS,
  BASE_PASSIVE_SLOTS,
  buildSemesterTechniqueSlotProgressionSnapshot,
  clampTechniqueSlotCount,
  getSemesterTechniqueSlotUnlockRequirement,
  normalizeTechniqueSlotIds,
} from '../../src/systems/builds/index.js';

test('semester technique slot contract preserves the live baseline unlock semantics', () => {
  const snapshot = buildSemesterTechniqueSlotProgressionSnapshot(BASE_ACTIVE_SLOTS, BASE_PASSIVE_SLOTS, 0);

  assert.deepEqual(snapshot.displayed, { active: 3, passive: 2 });
  assert.deepEqual(snapshot.unlocked, { active: 2, passive: 1, ultimate: false });
  assert.equal(snapshot.unlockRequirements.active[2]?.realmIndex, 1);
  assert.equal(snapshot.unlockRequirements.passive[1]?.realmIndex, 2);
  assert.equal(snapshot.unlockRequirements.ultimate?.realmIndex, 3);
});

test('semester technique slot contract unlocks active 3, passive 2, and ultimate on the live realm thresholds', () => {
  assert.deepEqual(
    buildSemesterTechniqueSlotProgressionSnapshot(BASE_ACTIVE_SLOTS, BASE_PASSIVE_SLOTS, 1).unlocked,
    { active: 3, passive: 1, ultimate: false },
  );
  assert.deepEqual(
    buildSemesterTechniqueSlotProgressionSnapshot(BASE_ACTIVE_SLOTS, BASE_PASSIVE_SLOTS, 2).unlocked,
    { active: 3, passive: 2, ultimate: false },
  );
  assert.deepEqual(
    buildSemesterTechniqueSlotProgressionSnapshot(BASE_ACTIVE_SLOTS, BASE_PASSIVE_SLOTS, 3).unlocked,
    { active: 3, passive: 2, ultimate: true },
  );
});

test('semester technique slot helpers keep extended counts visible while clamping and normalizing arrays safely', () => {
  const snapshot = buildSemesterTechniqueSlotProgressionSnapshot(5, 4, 999);

  assert.deepEqual(snapshot.displayed, { active: 5, passive: 4 });
  assert.deepEqual(snapshot.unlocked, { active: 5, passive: 4, ultimate: true });
  assert.equal(clampTechniqueSlotCount(Number.NaN, BASE_ACTIVE_SLOTS), BASE_ACTIVE_SLOTS);
  assert.deepEqual(normalizeTechniqueSlotIds(['a'], 3), ['a', '', '']);
  assert.deepEqual(normalizeTechniqueSlotIds(['a', 'b', 'c'], 2), ['a', 'b']);
  assert.equal(getSemesterTechniqueSlotUnlockRequirement('ultimate', 0, snapshot.unlocked), null);
});
