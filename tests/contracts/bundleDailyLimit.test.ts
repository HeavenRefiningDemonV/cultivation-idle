import assert from 'node:assert/strict';
import test from 'node:test';

import { validateLoadedContent, type ValidatedContent } from '../../src/content/index.js';
import { buildApothecaryBuyReadModel } from '../../src/features/apothecary/apothecaryBuyReadModel.js';
import { useContentStore } from '../../src/stores/contentStore.js';
import { useInventoryStore } from '../../src/stores/inventoryStore.js';
import { useShopStore } from '../../src/stores/shopStore.js';
import { loadRawProgressionContent } from '../fixtures/progression/loadFixtureContext.js';

let validatedPromise: Promise<ValidatedContent> | null = null;

async function getValidated() {
  if (!validatedPromise) {
    validatedPromise = loadRawProgressionContent().then((raw) => validateLoadedContent(raw as never));
  }
  return validatedPromise;
}

function primeContent(validated: ValidatedContent) {
  useContentStore.setState({
    raw: validated,
    isLoaded: true,
    isLoading: false,
    error: null,
    maps: {
      ...useContentStore.getState().maps,
      apothecariesById: Object.fromEntries(validated.apothecary_shops.map((shop) => [shop.id, shop])),
      apothecariesByCityId: Object.fromEntries(validated.apothecary_shops.map((shop) => [shop.cityId, shop])),
      itemsById: Object.fromEntries(validated.items.map((item) => [item.id, item])),
      citiesById: Object.fromEntries(validated.cities.map((city) => [city.id, city])),
    },
  });
}

test('bundle read-model state tracks real runtime purchases and cap exhaustion', async () => {
  const validated = await getValidated();
  const shop = validated.apothecary_shops.find((entry) => entry.cityId === 'city_pinewind_hamlet');
  assert.ok(shop);

  primeContent(validated);
  useInventoryStore.getState().hardResetInventory();
  useShopStore.getState().hardResetShop();
  useInventoryStore.getState().addCurrency('gold', '999999');
  useInventoryStore.getState().addItem('cons_healing_pellet_t1', 6);
  useInventoryStore.getState().addItem('cons_ironblood_pellet_t1', 2);
  useInventoryStore.getState().addItem('cons_qi_elixir_t1', 1);

  const before = buildApothecaryBuyReadModel({
    content: validated,
    shop,
    inventoryItems: useInventoryStore.getState().items,
    currencies: useInventoryStore.getState().currencies,
    purchasedTodayByStockId: useShopStore.getState().purchasedToday[shop.id] ?? {},
  });
  assert.equal(before.bundleState.buyableNow, true);
  assert.ok(before.bundleState.bundle);

  before.bundleState.bundle?.items.forEach((item) => {
    const result = useShopStore.getState().buy(shop.id, item.stockId, item.qty);
    assert.equal(result.ok, true, `expected ${item.itemId} to buy cleanly`);
  });

  const after = buildApothecaryBuyReadModel({
    content: validated,
    shop,
    inventoryItems: useInventoryStore.getState().items,
    currencies: useInventoryStore.getState().currencies,
    purchasedTodayByStockId: useShopStore.getState().purchasedToday[shop.id] ?? {},
  });
  assert.equal(after.bundleState.bundle, null);
  assert.equal(after.floorStatuses.every((entry) => entry.met), true);

  const capped = buildApothecaryBuyReadModel({
    content: validated,
    shop,
    inventoryItems: {},
    currencies: { gold: '999999' },
    purchasedTodayByStockId: { 'shop_apothecary_pinewind:cons_ironblood_pellet_t1': 10 },
  });
  assert.equal(capped.bundleState.disableReason, 'Daily specialty stock exhausted.');
  assert.equal(capped.bundleState.buyableNow, false);
});
