import assert from 'node:assert/strict';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import test from 'node:test';

import { validateLoadedContent } from '../../src/content/index.js';
import { getConsumableSpec } from '../../src/systems/consumables/consumableCatalog.js';
import { buildLiveConsumableRoster } from '../../src/systems/consumables/liveConsumableRoster.js';

const CONTENT_DIR = path.resolve(process.cwd(), 'public', 'cultivation_idle_content_bible_v1_config');
const readJson = async (fileName: string) => JSON.parse(await fs.readFile(path.join(CONTENT_DIR, fileName), 'utf8'));

async function loadValidatedContent() {
  return validateLoadedContent({
    economy: await readJson('economy.json'), cities: await readJson('cities.json'), items: await readJson('items.json'),
    techniques: await readJson('techniques.json'), pavilions: await readJson('pavilions.json'), outskirts: await readJson('outskirts.json'),
    enemies: await readJson('enemies.json'), trials: await readJson('trials.json'), ruins: await readJson('ruins.json'),
    alchemy_recipes: await readJson('alchemy_recipes.json'), forge_blueprints: await readJson('forge_blueprints.json'),
    runes: await readJson('runes.json'), talisman_recipes: await readJson('talisman_recipes.json'), apothecary_shops: await readJson('apothecary_shops.json'),
    expeditions: await readJson('expeditions.json'), bounties: await readJson('bounties.json'), heart_laws: await readJson('heart_laws.json'),
    prestige_store: await readJson('prestige_store.json'),
  } as never);
}

test('every live apothecary stock item and live brew output has an implemented consumable spec', async () => {
  const content = await loadValidatedContent();
  const roster = buildLiveConsumableRoster(content);
  const liveIds = new Set(roster.filter((entry) => entry.status === 'live').map((entry) => entry.itemId));

  content.apothecary_shops.flatMap((shop) => shop.stock.map((entry) => entry.itemId)).forEach((itemId) => {
    if (!liveIds.has(itemId)) return;
    assert.ok(getConsumableSpec(itemId), `missing spec for live stock item ${itemId}`);
  });

  content.alchemy_recipes.flatMap((recipe) => Object.keys(recipe.outputs ?? {})).forEach((itemId) => {
    if (!liveIds.has(itemId)) return;
    assert.ok(getConsumableSpec(itemId), `missing spec for live brew item ${itemId}`);
  });

  assert.equal(roster.some((entry) => entry.itemId === 'cons_tribulation_buffer_t1' && entry.status === 'live'), false);
});
