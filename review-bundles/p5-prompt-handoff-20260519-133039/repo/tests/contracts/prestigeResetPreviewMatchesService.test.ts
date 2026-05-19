import assert from 'node:assert/strict';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import test from 'node:test';

import {
  PRESTIGE_RESET_CONTRACT_BUCKETS,
  classifyPrestigeResetBucket,
  getPrestigeResetContractSurface,
} from '../../src/services/prestige/PrestigeResetContract.js';

test('prestige reset contract exposes reset, carry, rebuilt, and hybrid buckets from service truth', () => {
  const surface = getPrestigeResetContractSurface({
    purchasesById: { ap_mastery_retention_25: 1 },
  });

  assert.equal(surface.reset.length > 8, true);
  assert.equal(surface.carry.some((line) => line.id === 'ap'), true);
  assert.equal(surface.rebuilt.some((line) => line.id === 'new_spirit_root'), true);
  assert.equal(surface.hybrid.some((line) => line.id === 'mastery_retention_active'), true);
  assert.equal(classifyPrestigeResetBucket('profession_queues')?.kind, 'reset');
  assert.equal(classifyPrestigeResetBucket('city_baseline')?.kind, 'rebuilt');
});

test('prestige reset contract ids correspond to reset service operations', async () => {
  const source = await fs.readFile(
    path.join(process.cwd(), 'src/services/prestige/PrestigeResetService.ts'),
    'utf8',
  );

  const expectedSourceSnippets: Record<string, string> = {
    realm_progress: 'resetGameRun()',
    cultivation_state: 'resetForNewLife()',
    inventory_currencies: 'resetInventory()',
    equipment_loadout: 'hardResetEquipment()',
    trial_progress: 'hardResetTrials()',
    ruins_progress: 'hardResetRuins()',
    outskirts_progress: 'hardResetOutskirts()',
    bounty_progress: 'hardResetBounties()',
    active_activity: 'hardResetActivity()',
    manual_satchel_pavilion: 'useManualSatchelStore.getState().hardReset()',
    technique_collection: 'useTechCollectionStore.getState().hardReset()',
    recipe_mastery: 'useRecipeMasteryStore.getState().hardReset()',
    profession_queues: 'alchemyQueue: []',
    expeditions: 'active: []',
    craft_session: 'activeSession: null',
    breakthrough_echoes: 'hardResetBreakthroughEchoes()',
    combat_state: 'resetCombat()',
    city_baseline: 'initializeFromContent',
    mastery_retention_active: 'applyMasteryRetention',
  };

  for (const [bucketId, snippet] of Object.entries(expectedSourceSnippets)) {
    assert.ok(
      PRESTIGE_RESET_CONTRACT_BUCKETS.some((line) => line.id === bucketId),
      `contract should define ${bucketId}`,
    );
    assert.match(source, new RegExp(snippet.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }
});
