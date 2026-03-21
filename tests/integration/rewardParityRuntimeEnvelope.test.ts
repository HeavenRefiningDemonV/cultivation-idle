import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import type { LoadedContentRaw } from '../../src/content/loaders.js';
import { validateLoadedContent } from '../../src/content/validators.js';
import { buildOutskirtsRewardBundle, buildRuinsFinalChestBonusBundle, mergeRewardBundles, rollRuinDropTable } from '../../src/systems/economy/activityRewardRuntime.js';
import { inspectRewardParity } from '../../src/systems/economy/rewardParityAudit.js';
import { applyLootBonuses } from '../../src/services/rewards/index.js';
import { getCityActivityRewardRoleProfile, isProtectedRuinsIdentityItem, isRuinsAnchorItem, isRuinsLeadMaterial, isRuinsSupportItem } from '../../src/systems/economy/activityRewardRoles.js';

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

const gold = (bundle: { currencies?: Record<string, string> }) => BigInt(String(bundle.currencies?.gold ?? '0'));
const qty = (bundle: { items?: Array<{ itemId: string; qty: number }> }, predicate: (itemId: string) => boolean) =>
  (bundle.items ?? []).filter((entry) => predicate(entry.itemId)).reduce((sum, entry) => sum + entry.qty, 0);

test('reward parity runtime envelope preserves the structural role boundary with live content', async () => {
  const content = await loadValidatedContent();
  const parity = inspectRewardParity(content);

  parity.forEach((report) => {
    const profile = getCityActivityRewardRoleProfile(report.cityId);
    const outskirts = content.outskirts.find((entry) => entry.cityId === report.cityId)!;
    const ruin = content.ruins.find((entry) => entry.cityId === report.cityId)!;
    assert.ok(profile);

    const outskirtsBoss = buildOutskirtsRewardBundle({ outskirtsDef: outskirts, dropsConfig: content.economy.drops?.outskirts, cityIndex: report.cityIndex, isBoss: true, rng: createSequenceRng([0.15, 0.45, 0.05, 0.1, 0.6, 0.25]) });
    const ruinsRoom = applyLootBonuses(rollRuinDropTable(ruin.dropsPerRoom, createSequenceRng([0.1, 0.2, 0.3, 0.4, 0.5])), 'ruins');
    const ruinsChestBase = rollRuinDropTable(ruin.finalChestDrops, createSequenceRng([0.2, 0.3, 0.4, 0.5, 0.6]));
    const ruinsChestBonus = buildRuinsFinalChestBonusBundle({ economy: content.economy, cityIndex: report.cityIndex, rng: createSequenceRng([0.25, 0.75]) });
    const ruinsChest = applyLootBonuses(mergeRewardBundles(ruinsChestBase, ruinsChestBonus), 'ruins');

    assert.equal(report.expectedGoldPosture.outskirtsBossAvg > report.expectedGoldPosture.ruinsFinalChestAvg, true, `${report.cityId} expected gold boundary drifted`);
    assert.equal(report.expectedRuinsPosture.targetedExpected > report.expectedOutskirtsPosture.targetedExpected, true, `${report.cityId} expected targeted boundary drifted`);
    assert.equal(gold(ruinsRoom) > 0n || gold(ruinsChest) > 0n, true, `${report.cityId} ruins lost their secondary gold marker`);
    assert.equal(gold(outskirtsBoss) > gold(ruinsRoom), true, `${report.cityId} outskirts boss stopped feeling like the better gold punch`);
    assert.equal(qty(ruinsChest, (itemId) => isRuinsLeadMaterial(report.cityId, itemId) || isRuinsAnchorItem(report.cityId, itemId)) > 0, true, `${report.cityId} ruins chest lost targeted identity`);
    assert.equal(qty(ruinsChest, (itemId) => isProtectedRuinsIdentityItem(report.cityId, itemId)) >= qty(outskirtsBoss, (itemId) => isProtectedRuinsIdentityItem(report.cityId, itemId)), true, `${report.cityId} ruins chest no longer outperforms outskirts on targeted identity`);
    assert.equal(qty(ruinsChest, (itemId) => isRuinsSupportItem(report.cityId, itemId)) + qty(ruinsChestBonus, (itemId) => isRuinsSupportItem(report.cityId, itemId)) >= qty(ruinsChestBase, (itemId) => isRuinsSupportItem(report.cityId, itemId)), true, `${report.cityId} ruins pity/support bonus stopped being additive`);
  });
});
