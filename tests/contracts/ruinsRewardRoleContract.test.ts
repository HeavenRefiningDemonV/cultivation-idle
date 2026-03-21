import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import type { LoadedContentRaw } from '../../src/content/loaders.js';
import { validateLoadedContent } from '../../src/content/validators.js';
import { inspectActivityRewardRouting } from '../../src/systems/economy/activityRewardAudit.js';

const CONTENT_DIR = path.resolve(process.cwd(), 'public/cultivation_idle_content_bible_v1_config');
const CONTENT_FILES: Record<keyof LoadedContentRaw, string> = {
  economy: 'economy.json', cities: 'cities.json', items: 'items.json', techniques: 'techniques.json', pavilions: 'pavilions.json', outskirts: 'outskirts.json', enemies: 'enemies.json', trials: 'trials.json', ruins: 'ruins.json', alchemy_recipes: 'alchemy_recipes.json', forge_blueprints: 'forge_blueprints.json', runes: 'runes.json', talisman_recipes: 'talisman_recipes.json', apothecary_shops: 'apothecary_shops.json', expeditions: 'expeditions.json', bounties: 'bounties.json', heart_laws: 'heart_laws.json', prestige_store: 'prestige_store.json',
};

async function loadValidatedContent() {
  const entries = await Promise.all(Object.entries(CONTENT_FILES).map(async ([key, fileName]) => [key, JSON.parse(await fs.readFile(path.join(CONTENT_DIR, fileName), 'utf8'))] as const));
  return validateLoadedContent(Object.fromEntries(entries) as LoadedContentRaw);
}

test('ruins preserve deterministic anchors, lead materials, and secondary gold identity', async () => {
  const content = await loadValidatedContent();
  const reports = inspectActivityRewardRouting(content);

  reports.forEach((report) => {
    assert.equal(report.ruinsAnchorItemId !== null, true, `${report.cityId} missing anchor`);
    assert.equal(report.ruinsGuaranteedAnchors.includes(report.ruinsAnchorItemId!), true, `${report.cityId} guaranteed anchor drift`);
    assert.equal(report.ruinsLeadMaterialsPresent.length >= 2, true, `${report.cityId} weak lead material identity`);
    assert.equal((report.ruinsGoldPosture?.finalChestAvg ?? 0) > (report.ruinsGoldPosture?.perRoomAvg ?? 0), true, `${report.cityId} final chest should still be the richer gold moment`);
    assert.equal((report.outskirtsGoldPosture?.bossAvg ?? 0) > (report.ruinsGoldPosture?.finalChestAvg ?? 0), true, `${report.cityId} ruins should not replace outskirts as headline gold engine`);
  });
});
