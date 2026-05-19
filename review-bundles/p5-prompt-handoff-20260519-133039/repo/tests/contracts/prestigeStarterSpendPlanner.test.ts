import assert from 'node:assert/strict';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import test from 'node:test';

import { validateLoadedContent } from '../../src/content/index.js';
import { buildPrestigeStarterSpendPlan } from '../../src/systems/prestige/prestigeStarterSpendPlanner.js';
import { getPrestigeRuntimeCatalog } from '../../src/systems/prestige/runtime/prestigeRuntimeCatalog.js';

const CONTENT_DIR = path.resolve(process.cwd(), 'public', 'cultivation_idle_content_bible_v1_config');

const readJson = async <T>(fileName: string): Promise<T> =>
  JSON.parse(await fs.readFile(path.join(CONTENT_DIR, fileName), 'utf8')) as T;

async function loadValidatedContent() {
  return validateLoadedContent({
    economy: await readJson('economy.json'),
    cities: await readJson('cities.json'),
    items: await readJson('items.json'),
    techniques: await readJson('techniques.json'),
    pavilions: await readJson('pavilions.json'),
    outskirts: await readJson('outskirts.json'),
    enemies: await readJson('enemies.json'),
    trials: await readJson('trials.json'),
    ruins: await readJson('ruins.json'),
    alchemy_recipes: await readJson('alchemy_recipes.json'),
    forge_blueprints: await readJson('forge_blueprints.json'),
    runes: await readJson('runes.json'),
    talisman_recipes: await readJson('talisman_recipes.json'),
    apothecary_shops: await readJson('apothecary_shops.json'),
    expeditions: await readJson('expeditions.json'),
    bounties: await readJson('bounties.json'),
    heart_laws: await readJson('heart_laws.json'),
    prestige_store: await readJson('prestige_store.json'),
    pavilion_records: await readJson('pavilion_records.json'),
  } as never);
}

test('starter spend planner stays bounded to visible live nodes and prioritizes active reclaim picks', async () => {
  const content = await loadValidatedContent();
  const runtime = getPrestigeRuntimeCatalog(content);

  const plan = buildPrestigeStarterSpendPlan({
    apBudget: 12,
    purchasedLevels: {},
    visibleUpgrades: runtime.visibleLiveNodes.map((node) => node.upgrade),
  });

  assert.notEqual(plan.topRecommendation, null);
  assert.equal(runtime.visibleLiveNodeIds.includes(plan.topRecommendation!.id), true);
  assert.equal(['ap_idle_qi_mult', 'ap_combat_mult'].includes(plan.topRecommendation!.id), true);
  assert.equal(plan.orderedPlan.some((entry) => entry.id === 'ap_offline_efficiency'), false);
});
