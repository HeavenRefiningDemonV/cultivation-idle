import assert from 'node:assert/strict';
import test from 'node:test';

import { useBeastLoreStore } from '../../src/features/court/useBeastLoreStore.js';
import { BEAST_ESSENCES } from '../../src/systems/ui/cultivation/cultivationPathData.js';

const store = () => useBeastLoreStore.getState();

void test('D11 Beast-Lore — absorb is bounded by the essence roster', () => {
  store().resetBeastLore();
  for (let i = 0; i < BEAST_ESSENCES.length + 5; i++) store().absorbEssence();
  assert.equal(store().absorbedCount, BEAST_ESSENCES.length, 'never exceeds the roster');
  store().resetBeastLore();
  assert.equal(store().absorbedCount, 0);
});

void test('D11 Beast-Lore — the tally persists (slice 2): toSaveState ↔ hydrateFromSave round-trips', () => {
  store().resetBeastLore();
  store().absorbEssence();
  store().absorbEssence();
  const saved = store().toSaveState();
  assert.equal(saved.absorbedCount, 2);

  store().resetBeastLore();
  assert.equal(store().absorbedCount, 0);
  store().hydrateFromSave(saved);
  assert.equal(store().absorbedCount, 2, 'survives a save/load round-trip');

  // legacy save (missing slice) ⇒ default 0, never crashes
  store().hydrateFromSave(null);
  assert.equal(store().absorbedCount, 0, 'legacy/absent ⇒ 0 (no migration needed)');
  // defensive clamps on a malformed save
  store().hydrateFromSave({ absorbedCount: 999 });
  assert.equal(store().absorbedCount, BEAST_ESSENCES.length, 'over-cap clamps to the roster');
  store().hydrateFromSave({ absorbedCount: -4 });
  assert.equal(store().absorbedCount, 0, 'negative ⇒ 0');
  store().resetBeastLore();
});
