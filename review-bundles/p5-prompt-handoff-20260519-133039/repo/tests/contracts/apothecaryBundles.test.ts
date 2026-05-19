import assert from 'node:assert/strict';
import test from 'node:test';

import { validateLoadedContent, type ValidatedContent } from '../../src/content/index.js';
import { buildApothecaryCityBundle } from '../../src/features/apothecary/apothecaryBundles.js';
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

test('city bundle is derived from live shop stock and current reserve gaps', async () => {
  const validated = await getValidated();
  const shop = getShop(validated, 'city_lotusford');
  const inventoryItems = { cons_healing_pellet_t1: 4 };

  const bundle = buildApothecaryCityBundle({
    content: validated,
    shop,
    inventoryItems,
    purchasedTodayByStockId: {},
  });

  assert.ok(bundle);
  assert.equal(bundle?.name, 'Lotusford Readiness Bundle');
  assert.deepEqual(bundle?.items, [
    {
      stockId: 'shop_apothecary_lotusford:cons_healing_pellet_t1',
      itemId: 'cons_healing_pellet_t1',
      qty: 8,
      itemName: 'Healing Pellet',
    },
    {
      stockId: 'shop_apothecary_lotusford:cons_anti_venom_pellet_t1',
      itemId: 'cons_anti_venom_pellet_t1',
      qty: 4,
      itemName: 'Anti-Venom Pellet',
    },
    {
      stockId: 'shop_apothecary_lotusford:cons_quiet_breath_tea_t1',
      itemId: 'cons_quiet_breath_tea_t1',
      qty: 3,
      itemName: 'Quiet Breath Tea',
    },
  ]);
  assert.equal(bundle?.cost.gold, '175760');
});

test('city bundle respects remaining daily limits and disappears once reserve gaps are covered', async () => {
  const validated = await getValidated();
  const shop = getShop(validated, 'city_lotusford');

  const limitedBundle = buildApothecaryCityBundle({
    content: validated,
    shop,
    inventoryItems: { cons_healing_pellet_t1: 12 },
    purchasedTodayByStockId: { 'shop_apothecary_lotusford:cons_anti_venom_pellet_t1': 6 },
  });

  assert.ok(limitedBundle);
  const antiVenomLine = limitedBundle?.items.find((entry) => entry.itemId === 'cons_anti_venom_pellet_t1');
  const quietBreathLine = limitedBundle?.items.find((entry) => entry.itemId === 'cons_quiet_breath_tea_t1');
  assert.equal(antiVenomLine?.qty, 2);
  assert.equal(quietBreathLine?.qty, 3);

  const coveredBundle = buildApothecaryCityBundle({
    content: validated,
    shop,
    inventoryItems: {
      cons_healing_pellet_t1: 12,
      cons_anti_venom_pellet_t1: 4,
      cons_quiet_breath_tea_t1: 3,
    },
    purchasedTodayByStockId: {},
  });

  assert.equal(coveredBundle, null);
});
