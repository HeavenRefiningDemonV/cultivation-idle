import assert from 'node:assert/strict';
import test from 'node:test';

import { validateLoadedContent, type ValidatedContent } from '../../src/content/index.js';
import { buildApothecaryPrepReadModel } from '../../src/features/apothecary/apothecaryPrepReadModel.js';
import { createDefaultMedicinePouchState } from '../../src/stores/medicinePouchStore.js';
import { buildLiveEconomyCatalog } from '../../src/systems/economy/index.js';
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

test('recommended package only points at live items and computes owned/missing + buy route correctly', async () => {
  const validated = await getValidated();
  const catalog = buildLiveEconomyCatalog(validated);
  const model = buildApothecaryPrepReadModel({
    content: validated,
    shop: getShop(validated, 'city_pinewind_hamlet'),
    inventoryItems: { cons_healing_pellet_t1: 2 },
    pouchSlots: createDefaultMedicinePouchState().slots,
  });

  assert.ok(model.recommendedPackage.length >= 2);
  model.recommendedPackage.forEach((entry) => {
    assert.equal(catalog.itemStatusById[entry.itemId], 'visible_live');
    assert.ok(entry.targetQty >= entry.ownedQty);
  });

  const healingEntry = model.recommendedPackage.find((entry) => entry.key === 'healing');
  assert.ok(healingEntry);
  assert.equal(healingEntry?.ownedQty, 2);
  assert.equal(healingEntry?.missingQty, 10);
  assert.equal(healingEntry?.routeIntent.kind, 'buy');
});

test('recommended package can route to brew or source missing mats without pointing at deferred-only outputs', async () => {
  const validated = await getValidated();
  const pouchSlots = createDefaultMedicinePouchState().slots;
  const lotusShop = getShop(validated, 'city_lotusford');

  const missingMats = buildApothecaryPrepReadModel({
    content: validated,
    shop: lotusShop,
    inventoryItems: {},
    pouchSlots,
  });
  const missingEntry = missingMats.recommendedPackage.find((entry) => entry.key === 'breakthrough');
  assert.ok(missingEntry);

  const supportingRecipe = validated.alchemy_recipes.find((recipe) =>
    Object.keys(recipe.outputs ?? {}).includes(missingEntry.itemId),
  );
  assert.ok(supportingRecipe);
  const brewReadyInventory = Object.fromEntries(
    Object.entries(supportingRecipe?.inputs ?? {}).map(([itemId, qty]) => [itemId, Number(qty)]),
  );

  const brewReady = buildApothecaryPrepReadModel({
    content: validated,
    shop: lotusShop,
    inventoryItems: brewReadyInventory,
    pouchSlots,
  });
  const brewEntry = brewReady.recommendedPackage.find((entry) => entry.key === 'breakthrough');
  assert.ok(brewEntry);
  assert.equal(brewEntry?.routeIntent.kind, 'brew');

  assert.ok(missingEntry);
  assert.equal(missingEntry?.routeIntent.kind, 'source_missing_mats');
});
