import assert from 'node:assert/strict';
import test from 'node:test';

import { validateLoadedContent, type ValidatedContent } from '../../src/content/index.js';
import { buildApothecaryPrepReadModel } from '../../src/features/apothecary/apothecaryPrepReadModel.js';
import { createDefaultMedicinePouchState } from '../../src/stores/medicinePouchStore.js';
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

test('bounded apothecary warnings fire and clear under their live-state rules', async () => {
  const validated = await getValidated();
  const shop = getShop(validated, 'city_pinewind_hamlet');
  const pouch = createDefaultMedicinePouchState();

  const blocked = buildApothecaryPrepReadModel({
    content: validated,
    shop,
    inventoryItems: {},
    pouchSlots: pouch.slots,
    purchasedTodayByStockId: {},
    brewQueue: [],
  });

  assert.deepEqual(
    blocked.stockWarnings.map((warning) => warning.code),
    [
      'healing_stock_below_floor',
      'no_current_city_specialty_stock',
      'breakthrough_prep_missing',
      'medicine_pouch_not_configured',
    ],
  );

  const ready = buildApothecaryPrepReadModel({
    content: validated,
    shop,
    inventoryItems: {
      cons_healing_pellet_t1: 12,
      cons_ironblood_pellet_t1: 4,
      cons_qi_elixir_t1: 3,
    },
    pouchSlots: {
      ...pouch.slots,
      healing: { ...pouch.slots.healing, equippedItemId: 'cons_healing_pellet_t1', enabled: true },
    },
    purchasedTodayByStockId: {},
    brewQueue: [],
  });

  assert.equal(ready.stockWarnings.some((warning) => warning.code === 'healing_stock_below_floor'), false);
  assert.equal(ready.stockWarnings.some((warning) => warning.code === 'no_current_city_specialty_stock'), false);
  assert.equal(ready.stockWarnings.some((warning) => warning.code === 'breakthrough_prep_missing'), false);
  assert.equal(ready.stockWarnings.some((warning) => warning.code === 'medicine_pouch_not_configured'), false);
});
