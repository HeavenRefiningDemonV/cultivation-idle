import assert from 'node:assert/strict';
import test from 'node:test';

import { listAlchemyRecipes, listRawAlchemyRecipes } from '../../src/content/alchemy.js';
import { validateLoadedContent } from '../../src/content/index.js';
import { buildLiveEconomyCatalog } from '../../src/systems/economy/index.js';
import {
  getForgeBlueprint,
  getRawForgeBlueprint,
  listForgeBlueprints,
  listRawForgeBlueprints,
  useContentStore,
} from '../../src/stores/contentStore.js';
import { loadRawProgressionContent } from '../fixtures/progression/loadFixtureContext.js';

let validatedPromise: ReturnType<typeof loadValidatedContent> | null = null;

async function loadValidatedContent() {
  return validateLoadedContent((await loadRawProgressionContent()) as never);
}

async function getValidated() {
  if (!validatedPromise) validatedPromise = loadValidatedContent();
  return validatedPromise;
}

test('packet 3.1A live alchemy accessors quarantine deferred outputs while raw loaders keep authored data', async () => {
  const validated = await getValidated();
  useContentStore.setState({ raw: validated, isLoaded: true, isLoading: false, error: null });

  const rawRecipeIds = listRawAlchemyRecipes().map((recipe) => recipe.id);
  const liveRecipeIds = listAlchemyRecipes().map((recipe) => recipe.id);

  assert.ok(rawRecipeIds.includes('alc_reagent_spirit_solvent_t1'));
  assert.ok(rawRecipeIds.includes('alc_tribulation_buffer_t1'));
  assert.equal(liveRecipeIds.includes('alc_reagent_spirit_solvent_t1'), false);
  assert.equal(liveRecipeIds.includes('alc_tribulation_buffer_t1'), false);
  assert.ok(liveRecipeIds.includes('alc_healing_pellet_t1'));
  assert.ok(liveRecipeIds.includes('alc_reagent_quenching_oil_t1'));
});

test('packet 3.1A live forge accessors hide talisman/jade-core/legacy-rune content while keeping canonical rune family visible', async () => {
  const validated = await getValidated();
  useContentStore.setState({ raw: validated, isLoaded: true, isLoading: false, error: null });

  const rawBlueprintIds = listRawForgeBlueprints().map((blueprint) => blueprint.id);
  const liveBlueprintIds = listForgeBlueprints().map((blueprint) => blueprint.id);

  assert.ok(rawBlueprintIds.includes('formation_plate_basic'));
  assert.ok(rawBlueprintIds.includes('forge_jade_core_shell_t1'));
  assert.ok(rawBlueprintIds.includes('rune_inscription_basic'));

  assert.equal(liveBlueprintIds.includes('formation_plate_basic'), false);
  assert.equal(liveBlueprintIds.includes('forge_jade_core_shell_t1'), false);
  assert.equal(liveBlueprintIds.includes('forge_jade_core_upgrade_t2'), false);
  assert.equal(liveBlueprintIds.includes('rune_inscription_basic'), false);
  assert.equal(liveBlueprintIds.includes('rune_inscription_advanced'), false);

  assert.ok(liveBlueprintIds.includes('forge_rune_ember_t1'));
  assert.ok(liveBlueprintIds.includes('forge_rune_fortify_t1'));
  assert.ok(liveBlueprintIds.includes('forge_temper_weapon_t1'));
  assert.ok(liveBlueprintIds.includes('forge_refine_legendary_t5'));

  assert.equal(getRawForgeBlueprint('formation_plate_basic')?.id, 'formation_plate_basic');
  assert.equal(getForgeBlueprint('formation_plate_basic'), undefined);
  assert.equal(getForgeBlueprint('forge_rune_ember_t1')?.id, 'forge_rune_ember_t1');
});

test('packet 3.1A runtime catalog marks hidden outputs and duplicate rune families explicitly', async () => {
  const validated = await getValidated();
  const catalog = buildLiveEconomyCatalog(validated);

  assert.equal(catalog.itemStatusById.reagent_spirit_solvent_t1, 'migration_refund_only');
  assert.equal(catalog.itemStatusById.cons_tribulation_buffer_t1, 'migration_refund_only');
  assert.equal(catalog.itemStatusById.tal_guardian_seal_t1, 'migration_refund_only');
  assert.equal(catalog.itemStatusById.item_jade_core_shell_t1, 'migration_refund_only');

  assert.equal(catalog.alchemyRecipeStatusById.alc_reagent_spirit_solvent_t1, 'hidden_deferred');
  assert.equal(catalog.alchemyRecipeStatusById.alc_tribulation_buffer_t1, 'hidden_deferred');
  assert.equal(catalog.forgeBlueprintStatusById.formation_plate_basic, 'hidden_deferred');
  assert.equal(catalog.forgeBlueprintStatusById.forge_jade_core_shell_t1, 'hidden_deferred');
  assert.equal(catalog.forgeBlueprintStatusById.rune_inscription_basic, 'migration_refund_only');
  assert.equal(catalog.forgeBlueprintStatusById.forge_rune_ember_t1, 'visible_live');
});
