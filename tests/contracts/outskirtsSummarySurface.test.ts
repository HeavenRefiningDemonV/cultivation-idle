import assert from 'node:assert/strict';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import test from 'node:test';

import { buildOutskirtsActivityRewardReadModel } from '../../src/systems/economy/activityRewardReadModel.js';
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
    prestige_store: await readJson('prestige_store.json'), pavilion_records: await readJson('pavilion_records.json'), onboarding_milestones: await readJson('onboarding_milestones.json'),
    cultivator_stats: await readJson('stats.json'), training_regimens: await readJson('training_regimens.json'), dao_heart_practices: await readJson('dao_heart_practices.json'),
    spirit_roots: await readJson('spirit_roots.json'), readiness_categories: await readJson('readiness_categories.json'),
  } as never);
}

test('outskirts summary surface preserves canonical role framing and boundary copy', async () => {
  const content = await loadValidatedContent();
  const cityId = content.cities[0]?.id;
  assert.ok(cityId);

  const model = buildOutskirtsActivityRewardReadModel(content, cityId);
  assert.equal(model.roleTag, 'Gold & Common Mats');
  assert.equal(model.bestUsedWhen, 'Best used when you need gold, common materials, or low-risk combat reps.');
  assert.equal(model.boundaryLine, 'Not the best source for targeted city materials.');
});
