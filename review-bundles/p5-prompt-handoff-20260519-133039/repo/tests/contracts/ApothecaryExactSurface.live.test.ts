import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';

import { validateLoadedContent, type ValidatedContent } from '../../src/content/index.js';
import { getGatePrepPackageForCity } from '../../src/features/apothecary/gatePrepPackageCatalog.js';
import { loadRawProgressionContent } from '../fixtures/progression/loadFixtureContext.js';

let validatedPromise: Promise<ValidatedContent> | null = null;

async function getValidated() {
  if (!validatedPromise) {
    validatedPromise = loadRawProgressionContent().then((raw) => validateLoadedContent(raw as never));
  }
  return validatedPromise;
}

void test('Apothecary Exact live source adapts current content and preserves pre-APX-14 honesty gates', async () => {
  const validated = await getValidated();
  const packageDef = getGatePrepPackageForCity('city_pinewind_hamlet');
  const shop = validated.apothecary_shops.find((entry) => entry.cityId === 'city_pinewind_hamlet');
  assert.ok(packageDef);
  assert.ok(shop);

  const itemNameById = new Map(validated.items.map((item) => [item.id, item.name]));
  assert.deepEqual(packageDef.directCore.map((line) => itemNameById.get(line.itemId)), [
    'Healing Pellet',
    'Ironblood Pellet',
    'Qi Elixir',
  ]);
  assert.deepEqual(shop.stock.map((entry) => itemNameById.get(entry.itemId)), [
    'Healing Pellet',
    'Ironblood Pellet',
    'Qi Elixir',
  ]);
  assert.equal(packageDef.directCore.some((line) => itemNameById.get(line.itemId) === 'Ward Salt'), false);
  assert.equal(packageDef.directCore.some((line) => itemNameById.get(line.itemId) === 'Focus Dew'), false);
  assert.equal(packageDef.directCore.some((line) => itemNameById.get(line.itemId) === 'Meridian Tea'), false);

  const source = readFileSync('src/features/apothecary/exact/buildApothecaryExactSurface.ts', 'utf8');
  assert.equal(source.includes('getGatePrepPackageForCity(args.cityId)'), true);
  assert.equal(source.includes('buildContentParityWarnings(resolvedCityId, prescriptionRows)'), true);
  assert.equal(source.includes('APX-14 blocked: live Pinewind package is truthful to current content'), true);
  assert.equal(source.includes('`${pouch.filledSlots} / ${pouch.totalSlots} Set`'), true);
  assert.equal(source.includes('`${pouch.filledSlots} / ${pouch.totalSlots} slots configured`'), true);
});

void test('Apothecary Exact live source wires current-store buy, brew, pouch, and content-parity inputs', () => {
  const source = readFileSync('src/features/apothecary/exact/buildApothecaryExactSurface.ts', 'utf8');

  for (const required of [
    'buildApothecaryPrepReadModel',
    'buildApothecaryBuyReadModel',
    'useInventoryStore.getState()',
    'useShopStore.getState()',
    'useMedicinePouchStore.getState().slots',
    'useProfessionStore.getState().alchemyQueue',
    'shopState.canBuy',
    'recipeForOutput',
    'No visible live recipe in this city.',
    'Live surface is adapted from current Apothecary content',
    'Alchemy remains an Apothecary brew focus, not a separate live room.',
  ]) {
    assert.equal(source.includes(required), true, `live builder missing ${required}`);
  }

  const presentation = readFileSync('src/features/apothecary/exact/apothecaryExactPresentation.ts', 'utf8');
  assert.equal(presentation.includes("value: '3 / 5 Set'"), true, 'fixture may display 3 / 5');
  assert.equal(source.includes('/ 5 slots configured`'), false, 'live pouch count must come from current total slots before APX-15');
});
