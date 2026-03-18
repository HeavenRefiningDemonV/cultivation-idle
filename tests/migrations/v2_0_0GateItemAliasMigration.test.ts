import assert from 'node:assert/strict';
import test from 'node:test';

import { runSaveMigrations } from '../../src/save/migrations/index.js';
import { loadMigrationFixture } from './loadFixture.js';

const passthrough = (save: Record<string, unknown>) => save;
const readRecord = (value: unknown): Record<string, unknown> => (value && typeof value === 'object' ? (value as Record<string, unknown>) : {});

test('gate item alias migration apply remaps legacy ids into canonical gate ids and merges quantities', async () => {
  const fixture = await loadMigrationFixture('legacy-gate-item-ids');
  const mergedFixture = {
    ...fixture,
    inventoryState: {
      ...readRecord(fixture.inventoryState),
      items: {
        ...readRecord(readRecord(fixture.inventoryState).items),
        gate_foundation_pill: 3,
      },
    },
  };

  const applied = runSaveMigrations(mergedFixture, { mode: 'apply', normalizeToCurrent: passthrough });
  const inventoryState = readRecord(applied.migrated.inventoryState);
  const items = readRecord(inventoryState.items);
  const step = applied.report.stepResults.find((entry) => entry.stepId === 'v2_0_0_plan_gate_item_alias_migration');

  assert.equal(step?.ownerPacket, '1.3');
  assert.equal(step?.didMutate, true);
  assert.equal(items.gate_foundation_pill, 5);
  assert.equal(items.gate_core_catalyst, 1);
  assert.equal(items.foundation_pill, undefined);
  assert.equal(items.core_catalyst, undefined);
  assert.equal(items.herb, 7);
  assert.equal(applied.report.warnings.some((entry) => entry.code === 'CANONICAL_GATE_ID_NORMALIZED'), true);
});
