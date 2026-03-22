import assert from 'node:assert/strict';
import test from 'node:test';

import { validateLoadedContent, type ValidatedContent } from '../../src/content/index.js';
import { buildApothecaryCityBundle } from '../../src/features/apothecary/apothecaryBundles.js';
import { evaluateGatePrepPackageCoverage } from '../../src/features/apothecary/apothecaryPackageCoverage.js';
import { GATE_PREP_PACKAGE_CATALOG } from '../../src/features/apothecary/gatePrepPackageCatalog.js';
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

test('every gate-prep package is semester-honest through shop stock plus visible-live brew support', async () => {
  const validated = await getValidated();

  GATE_PREP_PACKAGE_CATALOG.forEach((packageDef) => {
    const shop = getShop(validated, packageDef.cityId);
    const coverage = evaluateGatePrepPackageCoverage({
      content: validated,
      shop,
      bundle: buildApothecaryCityBundle({ content: validated, shop, inventoryItems: {}, purchasedTodayByStockId: {} }),
      packageDef,
    });

    assert.ok(coverage, `missing coverage for ${packageDef.transitionId}`);
    assert.equal(coverage?.honest, true, `${packageDef.transitionId} should be honest`);
    coverage?.lineCoverage.forEach((line) => {
      assert.equal(validated.items.some((item) => item.id === line.itemId), true, `${line.itemId} must exist`);
      assert.equal(line.soldDirectly, true, `${packageDef.transitionId} direct line ${line.itemId} must be sold`);
      if (line.exceedsSafeConvenienceShare) {
        assert.equal(line.visibleLiveBrew, true, `${packageDef.transitionId} ${line.itemId} must have brew support`);
      }
      if (line.dailyLimitCapped) {
        assert.equal(line.visibleLiveBrew, true, `${packageDef.transitionId} ${line.itemId} cap remainder must be brew-backed`);
      }
    });
    coverage?.supplementCoverage.forEach((lane) => {
      assert.equal(lane.honest, true, `${packageDef.transitionId} supplement ${lane.key} must stay live-honest`);
    });
  });
});
