import test from 'node:test';
import assert from 'node:assert/strict';
import { runSaveMigrations } from '../../src/save/migrations/index.js';

const passthrough = <T extends Record<string, unknown>>(save: T): T => save;
const readRecord = (value: unknown): Record<string, unknown> => (value && typeof value === 'object' ? (value as Record<string, unknown>) : {});

test('apply migration refunds hidden crafted outputs and clears queued ghost crafting work', () => {
  const result = runSaveMigrations(
    {
      version: '2.0.0',
      gameState: { realm: { index: 1 }, selectedPath: 'heaven' },
      inventoryState: {
        currencies: { gold: '5', spiritStones: '1', merit: '0' },
        items: {
          reagent_spirit_solvent_t1: 2,
          cons_tribulation_buffer_t1: 1,
          item_jade_core_shell_t1: 1,
          mat_artifact_shard_bundle: 2,
        },
      },
      professionState: {
        alchemyQueue: [{ id: 'a1', recipeId: 'alc_reagent_spirit_solvent_t1', qty: 1, startedAt: 0, endsAt: 1, cityId: 'city_spirit_cavern_city' }],
        talismanQueue: [],
        forgeQueue: [{ id: 'f1', blueprintId: 'forge_jade_core_shell_t1', qty: 1, startedAt: 0, endsAt: 1, cityId: 'city_spirit_cavern_city' }],
        lastTickAt: 0,
      },
      craftSessionState: {
        modeByStation: { forge: 'assisted' },
        activeSession: { sessionId: 's1', station: 'forge', mode: 'handsOn', sourceId: 'forge_jade_core_shell_t1', qty: 1, createdAt: 0, seed: 1, startedAt: 0, endsAt: 1, script: { steps: [] }, cursor: {}, payment: {} },
      },
      combatSettings: { autoAttack: true, autoCombatAI: true },
    },
    { mode: 'apply', normalizeToCurrent: passthrough },
  );

  const inventory = readRecord(result.migrated.inventoryState);
  const items = readRecord(inventory.items);
  const currencies = readRecord(inventory.currencies);
  const profession = readRecord(result.migrated.professionState);
  const craftSession = readRecord(result.migrated.craftSessionState);

  assert.equal('reagent_spirit_solvent_t1' in items, false);
  assert.equal('cons_tribulation_buffer_t1' in items, false);
  assert.equal('item_jade_core_shell_t1' in items, false);
  assert.equal('mat_artifact_shard_bundle' in items, false);
  assert.equal(Number(items.mat_crystal_shard ?? 0) > 0, true);
  assert.equal(Number(items.mat_aura_residue ?? 0) > 0, true);
  assert.equal(Number(items.mat_artifact_shard ?? 0) > 0, true);
  assert.equal(Number(items.mat_soul_ember ?? 0) > 0, true);
  assert.equal(Number(items.mat_rune_dust ?? 0) > 0, true);
  assert.equal(BigInt(String(currencies.gold ?? '0')) > 5n, true);
  assert.equal(BigInt(String(currencies.spiritStones ?? '0')) > 1n, true);
  assert.equal(currencies.merit, '0');
  assert.deepEqual(profession.alchemyQueue, []);
  assert.deepEqual(profession.forgeQueue, []);
  assert.equal(readRecord(craftSession).activeSession, null);
  assert.deepEqual(readRecord(craftSession).modeByStation, { forge: 'assisted' });
  assert.equal(result.report.appliedTransformSteps.includes('v2_0_0_plan_deferred_crafting_output_cleanup'), true);
});
