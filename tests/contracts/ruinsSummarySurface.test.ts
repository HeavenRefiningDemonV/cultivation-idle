import assert from 'node:assert/strict';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import test from 'node:test';

import {
  RUINS_BEST_USED_WHEN,
  RUINS_GOLD_SECONDARY_LINE,
  RUINS_ROLE_TAG,
  buildRuinsActivityRewardReadModel,
} from '../../src/systems/economy/activityRewardReadModel.js';
import { validateLoadedContent } from '../../src/content/index.js';

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

test('ruins summary surface preserves deterministic targeted-material framing', async () => {
  const content = await loadValidatedContent();
  const cityId = content.cities[0]?.id;
  assert.ok(cityId);

  const model = buildRuinsActivityRewardReadModel(content, cityId);
  assert.equal(model.roleTag, RUINS_ROLE_TAG);
  assert.equal(model.bestUsedWhen, RUINS_BEST_USED_WHEN);
  assert.equal(model.boundaryLine, RUINS_GOLD_SECONDARY_LINE);
  assert.equal(model.goldIsSecondary, true);
  assert.ok(model.roomCount > 0);
  assert.ok(model.leadLocalMaterials.length > 0);
  assert.ok(model.deterministicFinalAnchor);
  assert.ok(model.rarePitySummary);
});
