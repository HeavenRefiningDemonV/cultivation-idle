import assert from 'node:assert/strict';
import test from 'node:test';

import { validateLoadedContent, type ValidatedContent } from '../../src/content/index.js';
import { buildApothecaryBuyReadModel } from '../../src/features/apothecary/apothecaryBuyReadModel.js';
import { loadRawProgressionContent } from '../fixtures/progression/loadFixtureContext.js';

let validatedPromise: Promise<ValidatedContent> | null = null;

async function getValidated() {
  if (!validatedPromise) {
    validatedPromise = loadRawProgressionContent().then((raw) => validateLoadedContent(raw as never));
  }
  return validatedPromise;
}

function getShop(validated: ValidatedContent, cityId: string) {
  const shop = validated.apothecary_shops.find((entry) => entry.cityId === cityId);
  assert.ok(shop, `missing apothecary for ${cityId}`);
  return shop;
}

test('buy read model resolves the current-city bundle, floor summaries, and biggest shortfall honestly', async () => {
  const validated = await getValidated();
  const model = buildApothecaryBuyReadModel({
    content: validated,
    shop: getShop(validated, 'city_pinewind_hamlet'),
    inventoryItems: {},
    currencies: { gold: '999999' },
    purchasedTodayByStockId: {},
  });

  assert.equal(model.bundleState.bundle?.name, 'Pinewind Hamlet Readiness Bundle');
  assert.equal(model.bundleState.buyableNow, true);
  assert.equal(model.bundleState.remainingPurchasesToday, 2);
  assert.equal(model.biggestShortfallKey, 'healing');
  assert.equal(model.bundleImprovesBiggestShortfall, true);
  assert.deepEqual(
    model.floorStatuses.map((entry) => [entry.key, entry.ownedQty, entry.targetQty, entry.met]),
    [
      ['healing', 0, 12, false],
      ['specialty', 0, 4, false],
      ['cultivation', 0, 3, false],
    ],
  );
});

test('buy read model reports concrete disable reasons for gold and specialty-cap exhaustion', async () => {
  const validated = await getValidated();
  const shop = getShop(validated, 'city_lotusford');

  const brokeModel = buildApothecaryBuyReadModel({
    content: validated,
    shop,
    inventoryItems: {},
    currencies: { gold: '0' },
    purchasedTodayByStockId: {},
  });
  assert.equal(brokeModel.bundleState.disableReason, 'Not enough gold.');

  const cappedModel = buildApothecaryBuyReadModel({
    content: validated,
    shop,
    inventoryItems: {},
    currencies: { gold: '999999' },
    purchasedTodayByStockId: { 'shop_apothecary_lotusford:cons_anti_venom_pellet_t1': 8 },
  });
  assert.equal(cappedModel.bundleState.buyableNow, false);
  assert.equal(cappedModel.bundleState.remainingPurchasesToday, 0);
  assert.equal(cappedModel.bundleState.disableReason, 'Daily specialty stock exhausted.');
});
