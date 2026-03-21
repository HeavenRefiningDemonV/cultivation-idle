import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import type { LoadedContentRaw } from '../../src/content/loaders.js';
import { validateLoadedContent } from '../../src/content/validators.js';
import {
  OUTSKIRTS_BEST_USED_WHEN,
  OUTSKIRTS_BOUNDARY_LINE,
  OUTSKIRTS_ROLE_TAG,
  RUINS_BEST_USED_WHEN,
  RUINS_ROLE_TAG,
  buildActivityRewardReadModel,
} from '../../src/systems/economy/activityRewardReadModel.js';
import { inspectRewardParity } from '../../src/systems/economy/rewardParityAudit.js';

const CONTENT_DIR = path.resolve(process.cwd(), 'public/cultivation_idle_content_bible_v1_config');
const CONTENT_FILES: Record<keyof LoadedContentRaw, string> = {
  economy: 'economy.json', cities: 'cities.json', items: 'items.json', techniques: 'techniques.json', pavilions: 'pavilions.json', outskirts: 'outskirts.json', enemies: 'enemies.json', trials: 'trials.json', ruins: 'ruins.json', alchemy_recipes: 'alchemy_recipes.json', forge_blueprints: 'forge_blueprints.json', runes: 'runes.json', talisman_recipes: 'talisman_recipes.json', apothecary_shops: 'apothecary_shops.json', expeditions: 'expeditions.json', bounties: 'bounties.json', heart_laws: 'heart_laws.json', prestige_store: 'prestige_store.json',
};

async function loadValidatedContent() {
  const entries = await Promise.all(Object.entries(CONTENT_FILES).map(async ([key, fileName]) => [key, JSON.parse(await fs.readFile(path.join(CONTENT_DIR, fileName), 'utf8'))] as const));
  return validateLoadedContent(Object.fromEntries(entries) as LoadedContentRaw);
}

test('reward parity audit keeps every live city on a distinct Outskirts-vs-Ruins lesson', async () => {
  const content = await loadValidatedContent();
  const readModel = buildActivityRewardReadModel(content);
  const parity = inspectRewardParity(content);

  assert.equal(readModel.length, parity.length);

  parity.forEach((report) => {
    assert.equal(report.hasDrift, false, `${report.cityId} drift: ${report.roleBoundaryDrift.join(' | ')}`);
    assert.equal(report.readModel.outskirts.roleTag, OUTSKIRTS_ROLE_TAG);
    assert.equal(report.readModel.outskirts.bestUsedWhen, OUTSKIRTS_BEST_USED_WHEN);
    assert.equal(report.readModel.outskirts.boundaryLine, OUTSKIRTS_BOUNDARY_LINE);
    assert.equal(report.readModel.ruins.roleTag, RUINS_ROLE_TAG);
    assert.equal(report.readModel.ruins.bestUsedWhen, RUINS_BEST_USED_WHEN);
    assert.equal(report.readModel.ruins.deterministicFinalAnchor !== null, true, `${report.cityId} missing ruin anchor`);
    assert.equal(report.readModel.ruins.pitySummary.length > 0, true, `${report.cityId} pity summary missing`);
    assert.equal(report.expectedGoldPosture.outskirtsBossAvg > report.expectedGoldPosture.ruinsFinalChestAvg, true, `${report.cityId} gold roles collapsed`);
    assert.equal(report.expectedOutskirtsPosture.commonExpected > report.expectedOutskirtsPosture.targetedExpected, true, `${report.cityId} outskirts common posture collapsed`);
    assert.equal(report.expectedRuinsPosture.anchorExpected >= 1, true, `${report.cityId} anchor lost`);
    assert.equal(report.expectedRuinsPosture.targetedExpected > report.expectedOutskirtsPosture.targetedExpected, true, `${report.cityId} ruins targeted posture collapsed`);
  });
});
