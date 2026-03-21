import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import type { LoadedContentRaw } from '../../src/content/loaders.js';
import { validateLoadedContent } from '../../src/content/validators.js';
import { createLiveEconomyCatalog, listVisibleAlchemyRecipes, listVisibleForgeBlueprints } from '../../src/systems/economy/liveEconomyCatalog.js';

const CONTENT_DIR = path.resolve(process.cwd(), 'public/cultivation_idle_content_bible_v1_config');
const CONTENT_FILES: Record<keyof LoadedContentRaw, string> = {
  economy: 'economy.json',
  cities: 'cities.json',
  items: 'items.json',
  techniques: 'techniques.json',
  pavilions: 'pavilions.json',
  outskirts: 'outskirts.json',
  enemies: 'enemies.json',
  trials: 'trials.json',
  ruins: 'ruins.json',
  alchemy_recipes: 'alchemy_recipes.json',
  forge_blueprints: 'forge_blueprints.json',
  runes: 'runes.json',
  talisman_recipes: 'talisman_recipes.json',
  apothecary_shops: 'apothecary_shops.json',
  expeditions: 'expeditions.json',
  bounties: 'bounties.json',
  heart_laws: 'heart_laws.json',
  prestige_store: 'prestige_store.json',
};

async function loadValidatedContent() {
  const entries = await Promise.all(
    Object.entries(CONTENT_FILES).map(async ([key, fileName]) => {
      const raw = await fs.readFile(path.join(CONTENT_DIR, fileName), 'utf8');
      return [key, JSON.parse(raw)] as const;
    }),
  );
  return validateLoadedContent(Object.fromEntries(entries) as LoadedContentRaw);
}

test('live-facing alchemy accessors quarantine Spirit Solvent and tribulation buffer outputs while raw content remains authored', async () => {
  const content = await loadValidatedContent();
  const rawIds = content.alchemy_recipes.map((recipe) => recipe.id);
  const liveIds = listVisibleAlchemyRecipes(content).map((recipe) => recipe.id);

  assert.equal(rawIds.includes('alc_reagent_spirit_solvent_t1'), true);
  assert.equal(rawIds.includes('alc_tribulation_buffer_t1'), true);
  assert.equal(liveIds.includes('alc_reagent_spirit_solvent_t1'), false);
  assert.equal(liveIds.includes('alc_tribulation_buffer_t1'), false);
  assert.equal(liveIds.includes('alc_healing_pellet_t1'), true);
  assert.equal(liveIds.includes('alc_reagent_soul_ink_t2'), true);
});

test('live-facing forge accessors quarantine talisman, Jade Core, and duplicate legacy rune outputs while keeping canonical forge runes visible', async () => {
  const content = await loadValidatedContent();
  const rawIds = content.forge_blueprints.map((blueprint) => blueprint.id);
  const liveBlueprints = listVisibleForgeBlueprints(content);
  const liveIds = liveBlueprints.map((blueprint) => blueprint.id);

  assert.equal(rawIds.includes('formation_plate_basic'), true);
  assert.equal(rawIds.includes('forge_jade_core_shell_t1'), true);
  assert.equal(rawIds.includes('rune_inscription_basic'), true);
  assert.equal(liveIds.includes('formation_plate_basic'), false);
  assert.equal(liveIds.includes('forge_jade_core_shell_t1'), false);
  assert.equal(liveIds.includes('forge_jade_core_upgrade_t2'), false);
  assert.equal(liveIds.includes('rune_inscription_basic'), false);
  assert.equal(liveIds.includes('forge_rune_ember_t1'), true);
  assert.equal(liveIds.includes('forge_rune_storm_t1'), true);
});

test('runtime catalog marks the deferred ghost outputs and exact blocker set explicitly', async () => {
  const content = await loadValidatedContent();
  const catalog = createLiveEconomyCatalog(content);

  assert.equal(catalog.itemStatuses.reagent_spirit_solvent_t1, 'migration_refund_only');
  assert.equal(catalog.itemStatuses.cons_tribulation_buffer_t1, 'migration_refund_only');
  assert.equal(catalog.itemStatuses.item_jade_core_shell_t1, 'migration_refund_only');
  assert.equal(catalog.itemStatuses.mat_artifact_shard_bundle, 'migration_refund_only');
  assert.equal(catalog.forgeBlueprintStatuses.forge_refine_legendary_t5, 'visible_live_blocked');
  assert.deepEqual(catalog.blockedItemIds, ['mat_artifact_shard', 'mat_spirit_dew', 'reagent_quenching_oil_t2']);
  assert.deepEqual(catalog.blockedForgeBlueprintIds, ['forge_refine_legendary_t5']);
});
