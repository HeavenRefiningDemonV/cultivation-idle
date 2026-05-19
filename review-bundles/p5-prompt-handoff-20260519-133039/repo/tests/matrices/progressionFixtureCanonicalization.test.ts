import assert from 'node:assert/strict';
import test from 'node:test';

import { buildProgressionFixture } from '../fixtures/progression/buildFixture.js';

test('legacy gate alias fixture keeps migration input legacy while canonicalizing save-shape output', async () => {
  const built = await buildProgressionFixture('legacy-gate-alias');
  const saveItems = ((built.saveShape?.inventoryState as Record<string, unknown>)?.items ?? {}) as Record<string, unknown>;
  const migrationItems = ((built.migrationFixture?.data as Record<string, unknown>)?.inventoryState as Record<string, unknown> | undefined)?.items as Record<string, unknown>;

  assert.equal(saveItems.gate_foundation_pill, 2);
  assert.equal(saveItems.gate_core_catalyst, 1);
  assert.equal(saveItems.foundation_pill, undefined);
  assert.equal(migrationItems.foundation_pill, 2);
  assert.equal(migrationItems.core_catalyst, 1);
});
