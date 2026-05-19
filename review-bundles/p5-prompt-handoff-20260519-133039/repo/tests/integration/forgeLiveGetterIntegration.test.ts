import assert from 'node:assert/strict';
import test from 'node:test';

import { validateLoadedContent } from '../../src/content/index.js';
import {
  getForgeBlueprint,
  getLiveForgeCatalog,
  getRawForgeBlueprint,
  listForgeBlueprintsForCity,
  listRawForgeBlueprints,
  useContentStore,
} from '../../src/stores/contentStore.js';
import { loadRawProgressionContent } from '../fixtures/progression/loadFixtureContext.js';

let validatedPromise: Promise<ReturnType<typeof validateLoadedContent>> | null = null;
async function getValidated() {
  if (!validatedPromise) validatedPromise = loadRawProgressionContent().then((raw) => validateLoadedContent(raw as never));
  return validatedPromise;
}

test('packet 3.5A content-store forge getters stay semester-clean while raw authored data remains available', async () => {
  const validated = await getValidated();
  useContentStore.setState({ raw: validated, isLoaded: true, isLoading: false, error: null });

  assert.ok(listRawForgeBlueprints().some((blueprint) => blueprint.id === 'formation_plate_basic'));
  assert.equal(getForgeBlueprint('formation_plate_basic'), undefined);
  assert.equal(getForgeBlueprint('forge_jade_core_shell_t1'), undefined);
  assert.equal(getRawForgeBlueprint('rune_inscription_basic')?.id, 'rune_inscription_basic');

  const pinewindIds = listForgeBlueprintsForCity({ cityId: 'city_pinewind_hamlet' }).map((blueprint) => blueprint.id).sort();
  assert.deepEqual(pinewindIds, [
    'forge_refine_basic',
    'forge_refine_rusty_t1',
    'forge_rune_ember_t1',
    'forge_rune_stone_t1',
    'forge_temper_accessory_t1',
    'forge_temper_weapon_t1',
  ]);

  const catalog = getLiveForgeCatalog();
  assert.ok(catalog);
  assert.equal(catalog?.entriesById.rune_inscription_basic?.status, 'migration_refund_only');
  assert.equal(catalog?.entriesById.forge_temper_weapon_t2?.status, 'visible_live');
});
