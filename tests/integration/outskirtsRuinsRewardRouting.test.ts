import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import type { LoadedContentRaw } from '../../src/content/loaders.js';
import { validateLoadedContent } from '../../src/content/validators.js';
import { buildOutskirtsRewardBundle, buildRuinsFinalChestBonusBundle, mergeRewardBundles, rollRuinDropTable } from '../../src/systems/economy/activityRewardRuntime.js';
import { getCityActivityRewardRoleProfile, isOutskirtsCommonFieldMaterial, isProtectedRuinsIdentityItem, isRuinsLeadMaterial } from '../../src/systems/economy/activityRewardRoles.js';
import { applyLootBonuses, type RewardBundle } from '../../src/services/rewards/index.js';

const CONTENT_DIR = path.resolve(process.cwd(), 'public/cultivation_idle_content_bible_v1_config');
const CONTENT_FILES: Record<keyof LoadedContentRaw, string> = {
  economy: 'economy.json', cities: 'cities.json', items: 'items.json', techniques: 'techniques.json', pavilions: 'pavilions.json', outskirts: 'outskirts.json', enemies: 'enemies.json', trials: 'trials.json', ruins: 'ruins.json', alchemy_recipes: 'alchemy_recipes.json', forge_blueprints: 'forge_blueprints.json', runes: 'runes.json', talisman_recipes: 'talisman_recipes.json', apothecary_shops: 'apothecary_shops.json', expeditions: 'expeditions.json', bounties: 'bounties.json', heart_laws: 'heart_laws.json', prestige_store: 'prestige_store.json',
};

async function loadValidatedContent() {
  const entries = await Promise.all(Object.entries(CONTENT_FILES).map(async ([key, fileName]) => [key, JSON.parse(await fs.readFile(path.join(CONTENT_DIR, fileName), 'utf8'))] as const));
  return validateLoadedContent(Object.fromEntries(entries) as LoadedContentRaw);
}

const createSequenceRng = (sequence: number[]) => {
  let index = 0;
  return () => {
    const value = sequence[index % sequence.length] ?? 0.5;
    index += 1;
    return value;
  };
};

const sumGold = (bundle: RewardBundle): bigint => BigInt(String(bundle.currencies?.gold ?? '0'));
const itemQty = (bundle: RewardBundle, predicate: (itemId: string) => boolean): number => (bundle.items ?? []).filter((entry) => predicate(entry.itemId)).reduce((sum, entry) => sum + entry.qty, 0);

test('runtime reward builders separate outskirts gold/common loops from ruins targeted/anchor loops', async () => {
  const content = await loadValidatedContent();
  const cityIds = ['city_pinewind_hamlet', 'city_stonecrag_town', 'city_spirit_cavern_city'];

  cityIds.forEach((cityId) => {
    const profile = getCityActivityRewardRoleProfile(cityId);
    const outskirts = content.outskirts.find((entry) => entry.cityId === cityId)!;
    const ruin = content.ruins.find((entry) => entry.cityId === cityId)!;
    assert.ok(profile);

    const outskirtsMob = buildOutskirtsRewardBundle({ outskirtsDef: outskirts, dropsConfig: content.economy.drops?.outskirts, cityIndex: outskirts.cityIndex, isBoss: false, rng: createSequenceRng([0.01, 0.15, 0.9, 0.02, 0.1, 0.3]) });
    const outskirtsBoss = buildOutskirtsRewardBundle({ outskirtsDef: outskirts, dropsConfig: content.economy.drops?.outskirts, cityIndex: outskirts.cityIndex, isBoss: true, rng: createSequenceRng([0.2, 0.4, 0.05, 0.1, 0.7, 0.3]) });
    const ruinsRoom = applyLootBonuses(rollRuinDropTable(ruin.dropsPerRoom, createSequenceRng([0.1, 0.2, 0.3, 0.4, 0.5])), 'ruins');
    const ruinsChest = applyLootBonuses(mergeRewardBundles(rollRuinDropTable(ruin.finalChestDrops, createSequenceRng([0.15, 0.25, 0.35, 0.45, 0.55])), buildRuinsFinalChestBonusBundle({ economy: content.economy, cityIndex: outskirts.cityIndex, rng: createSequenceRng([0.2, 0.6]) })), 'ruins');

    assert.equal(sumGold(outskirtsMob) > 0n, true, `${cityId} outskirts mob should pay gold`);
    assert.equal(sumGold(outskirtsBoss) > sumGold(ruinsRoom), true, `${cityId} outskirts boss should headline gold better than a ruins room`);
    assert.equal(itemQty(outskirtsMob, (itemId) => isOutskirtsCommonFieldMaterial(cityId, itemId) || itemId === 'crate_manual_scraps') >= itemQty(outskirtsMob, (itemId) => isProtectedRuinsIdentityItem(cityId, itemId)), true, `${cityId} outskirts mob should skew common/support first`);
    assert.equal(itemQty(ruinsChest, (itemId) => isRuinsLeadMaterial(cityId, itemId) || itemId === profile!.ruinsAnchorItemId) > 0, true, `${cityId} ruins chest should pay targeted/anchor identity`);
    assert.equal(itemQty(ruinsChest, (itemId) => isProtectedRuinsIdentityItem(cityId, itemId)) >= itemQty(outskirtsBoss, (itemId) => isProtectedRuinsIdentityItem(cityId, itemId)), true, `${cityId} ruins should outperform outskirts on targeted identity`);
  });
});
