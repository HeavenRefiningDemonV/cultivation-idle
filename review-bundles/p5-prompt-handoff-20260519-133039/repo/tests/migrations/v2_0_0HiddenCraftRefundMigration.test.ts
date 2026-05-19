import assert from 'node:assert/strict';
import test from 'node:test';

import { runSaveMigrations } from '../../src/save/migrations/index.js';
import { buildLiveEconomyCatalog } from '../../src/systems/economy/index.js';
import { validateLoadedContent } from '../../src/content/index.js';
import { loadMigrationFixture } from './loadFixture.js';
import { loadRawProgressionContent } from '../fixtures/progression/loadFixtureContext.js';

const passthrough = (save: Record<string, unknown>) => save;
const readRecord = (value: unknown): Record<string, unknown> => (value && typeof value === 'object' ? (value as Record<string, unknown>) : {});
const readArray = <T>(value: unknown): T[] => (Array.isArray(value) ? (value as T[]) : []);

let catalogPromise: Promise<ReturnType<typeof buildLiveEconomyCatalog>> | null = null;
async function getCatalog() {
  if (!catalogPromise) {
    catalogPromise = loadRawProgressionContent().then((raw) => buildLiveEconomyCatalog(validateLoadedContent(raw as never)));
  }
  return catalogPromise;
}

test('packet 3.1 migration refunds hidden craft outputs once and clears stale hidden craft state', async () => {
  const fixture = await loadMigrationFixture('current-save');
  const migratedInput = {
    ...fixture,
    gameState: {
      ...readRecord(fixture.gameState),
      realm: {
        ...readRecord(readRecord(fixture.gameState).realm),
        index: 1,
        substage: 0,
        name: 'Foundation Establishment',
      },
    },
    inventoryState: {
      ...readRecord(fixture.inventoryState),
      currencies: { gold: '100', spiritStones: '0', merit: '0' },
      items: {
        reagent_spirit_solvent_t1: 2,
        cons_tribulation_buffer_t1: 1,
        tal_guardian_seal_t1: 1,
        item_jade_core_shell_t1: 1,
      },
    },
    professionState: {
      alchemyQueue: [{ id: 'a1', recipeId: 'alc_reagent_spirit_solvent_t1', qty: 1, startedAt: 10, endsAt: 20, cityId: 'city_spirit_cavern_city' }],
      talismanQueue: [{ id: 't1', recipeId: 'tal_scholar_mark_t1', qty: 1, startedAt: 10, endsAt: 20, cityId: 'city_pinewind_hamlet' }],
      forgeQueue: [
        { id: 'f1', blueprintId: 'formation_plate_basic', qty: 1, startedAt: 10, endsAt: 20, cityId: 'city_pinewind_hamlet' },
        { id: 'f2', blueprintId: 'rune_inscription_basic', qty: 1, startedAt: 10, endsAt: 20, cityId: 'city_pinewind_hamlet' },
      ],
      lastTickAt: 0,
    },
    craftSessionState: {
      modeByStation: { alchemy: 'assisted', forge: 'assisted' },
      activeSession: {
        sessionId: 'hidden-session',
        station: 'forge',
        mode: 'assisted',
        sourceId: 'forge_jade_core_upgrade_t2',
        qty: 1,
        createdAt: 100,
        seed: 1,
        startedAt: 100,
        endsAt: 200,
        cursor: { stepIndex: 0 },
        script: { version: 1, station: 'forge', sourceId: 'forge_jade_core_upgrade_t2', steps: [] },
        prompts: [],
      },
    },
    buffState: {
      activeTalismans: [{ itemId: 'tal_fragment_magnet_t1', startedAt: 1, endsAt: 2 }],
    },
    medicinePouchState: {
      slots: {
        healing: { slotKey: 'healing', equippedItemId: 'cons_tribulation_buffer_t1', enabled: true, trigger: 'manual', thresholdPct: 50, cooldownSec: 8, bossOnly: false, lastUsedAt: 1 },
      },
    },
  };

  const once = runSaveMigrations(migratedInput, { mode: 'apply', normalizeToCurrent: passthrough });
  const twice = runSaveMigrations(once.migrated, { mode: 'apply', normalizeToCurrent: passthrough });

  const step = once.report.stepResults.find((entry) => entry.stepId === 'v2_0_0_refund_hidden_craft_outputs');
  assert.equal(step?.didMutate, true);

  const inventoryState = readRecord(once.migrated.inventoryState);
  const items = readRecord(inventoryState.items);
  const currencies = readRecord(inventoryState.currencies);
  const professionState = readRecord(once.migrated.professionState);
  const craftSessionState = readRecord(once.migrated.craftSessionState);
  const buffState = readRecord(once.migrated.buffState);
  const medicinePouchState = readRecord(once.migrated.medicinePouchState);

  ['reagent_spirit_solvent_t1', 'cons_tribulation_buffer_t1', 'tal_guardian_seal_t1', 'item_jade_core_shell_t1'].forEach((itemId) => {
    assert.equal(items[itemId], undefined, `${itemId} should be removed from inventory`);
  });
  assert.equal(currencies.gold, '2814000');
  assert.equal(currencies.spiritStones, '75');
  assert.equal(items.mat_crystal_shard, 12);
  assert.equal(items.mat_aura_residue, 6);
  assert.equal(items.mat_artifact_shard, 91);
  assert.equal(items.mat_soul_ember, 4);
  assert.equal(items.mat_rune_dust, 186);
  assert.equal(items.reagent_soul_ink_t0, 3);
  assert.equal(items.mat_quarry_ore, 4);
  assert.equal(items.mat_spirit_dew, 2);
  assert.equal(items.mat_spirit_leaf, 5);
  assert.equal(items.reagent_soul_ink_t2, 2);
  assert.equal(items.mat_spirit_steel_ore, undefined);

  assert.deepEqual(readArray(professionState.alchemyQueue), []);
  assert.deepEqual(readArray(professionState.talismanQueue), []);
  assert.deepEqual(readArray(professionState.forgeQueue), []);
  assert.equal(readRecord(craftSessionState).activeSession, null);
  assert.deepEqual(readArray(buffState.activeTalismans), []);
  assert.equal(readRecord(readRecord(medicinePouchState.slots).healing).equippedItemId, null);

  assert.deepEqual(twice.migrated, once.migrated);
  const secondStep = twice.report.stepResults.find((entry) => entry.stepId === 'v2_0_0_refund_hidden_craft_outputs');
  assert.equal(secondStep?.didMutate ?? false, false);
});

test('packet 3.1 migrated saves no longer carry hidden outputs in the live economy catalog', async () => {
  const fixture = await loadMigrationFixture('current-save');
  const migratedInput = {
    ...fixture,
    inventoryState: {
      ...readRecord(fixture.inventoryState),
      items: { reagent_spirit_solvent_t1: 1, tal_guardian_seal_t1: 1, item_jade_core_shell_t1: 1 },
    },
  };
  const once = runSaveMigrations(migratedInput, { mode: 'apply', normalizeToCurrent: passthrough });
  const catalog = await getCatalog();
  const items = readRecord(readRecord(once.migrated.inventoryState).items);

  Object.entries(catalog.itemStatusById).forEach(([itemId, status]) => {
    if (status === 'migration_refund_only' || status === 'hidden_deferred') {
      assert.equal(items[itemId], undefined, `${itemId} should not survive migration inventory cleanup`);
    }
  });
});
