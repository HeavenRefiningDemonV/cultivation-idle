import assert from 'node:assert/strict';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import test from 'node:test';

import { validateLoadedContent, type ValidatedContent } from '../../src/content/index.js';
import { buildApothecaryBuyReadModel } from '../../src/features/apothecary/apothecaryBuyReadModel.js';
import { useShopStore } from '../../src/stores/shopStore.js';
import { loadRawProgressionContent } from '../fixtures/progression/loadFixtureContext.js';

const readRepoFile = (relativePath: string) => fs.readFile(path.resolve(process.cwd(), relativePath), 'utf8');

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

test('buy-surface runtime truth matches the mounted Apothecary bundle copy and cap states', async () => {
  const validated = await getValidated();
  const panelSource = await readRepoFile('src/components/screens/ApothecaryPanel.tsx');
  const shop = getShop(validated, 'city_pinewind_hamlet');

  const before = buildApothecaryBuyReadModel({
    content: validated,
    shop,
    inventoryItems: {},
    currencies: { gold: '999999' },
    purchasedTodayByStockId: {},
  });

  assert.match(panelSource, /Convenience Bundles/);
  assert.match(panelSource, /Stock Floors/);
  assert.match(panelSource, /Immediate Readiness Coverage/);
  assert.match(panelSource, /Daily caps throttle convenience/);
  assert.equal(before.bundleState.bundle?.name, 'Pinewind Hamlet Readiness Bundle');
  assert.equal(before.bundleState.remainingPurchasesToday, 2);

  useShopStore.getState().hardResetShop();
  useShopStore.getState().hydrate({ purchasedToday: { shop_apothecary_pinewind: { 'shop_apothecary_pinewind:cons_ironblood_pellet_t1': 10 } } });
  const after = buildApothecaryBuyReadModel({
    content: validated,
    shop,
    inventoryItems: {},
    currencies: { gold: '999999' },
    purchasedTodayByStockId: useShopStore.getState().purchasedToday[shop.id] ?? {},
  });

  assert.equal(after.bundleState.buyableNow, false);
  assert.equal(after.bundleState.disableReason, 'Daily specialty stock exhausted.');
  assert.doesNotMatch(panelSource, /Combat Starter Kit|Cultivation Starter Kit/);
});
