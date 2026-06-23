import assert from 'node:assert/strict';
import test from 'node:test';

import { useWeaponBondStore } from '../../src/features/court/useWeaponBondStore.js';

const store = () => useWeaponBondStore.getState();

void test('D5 Weapon-Bond — deepenBond accrues; the meter persists (toSaveState ↔ hydrateFromSave)', () => {
  store().resetWeaponBond();
  store().deepenBond();
  store().deepenBond();
  store().deepenBond();
  assert.equal(store().bondKills, 3);
  const saved = store().toSaveState();
  assert.equal(saved.bondKills, 3);

  store().resetWeaponBond();
  assert.equal(store().bondKills, 0);
  store().hydrateFromSave(saved);
  assert.equal(store().bondKills, 3, 'survives a save/load round-trip');

  // legacy / malformed
  store().hydrateFromSave(null);
  assert.equal(store().bondKills, 0, 'legacy/absent ⇒ 0 (no migration needed)');
  store().hydrateFromSave({ bondKills: -2 });
  assert.equal(store().bondKills, 0, 'negative ⇒ 0');
  store().resetWeaponBond();
});
