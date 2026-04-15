import assert from 'node:assert/strict';
import test from 'node:test';

import { validateLoadedContent } from '../../src/content/index.js';
import { buildOutskirtsActivityRewardReadModel } from '../../src/systems/economy/activityRewardReadModel.js';
import { buildOutskirtsInformationHierarchySurface } from '../../src/ui/world/buildOutskirtsInformationHierarchySurface.js';
import { loadRawProgressionContent } from '../fixtures/progression/loadFixtureContext.js';

async function loadSurfaceInput() {
  const content = validateLoadedContent((await loadRawProgressionContent()) as never);
  const cityId = content.cities[0]?.id ?? 'city_pinewind_hamlet';
  const model = buildOutskirtsActivityRewardReadModel(content, cityId);
  const itemsById = Object.fromEntries(content.items.map((item) => [item.id, item.name]));
  return { model, itemsById };
}

void test('outskirts hierarchy surface keeps canonical role/use/boundary and readable expectation lines', async () => {
  const { model, itemsById } = await loadSurfaceInput();

  const surface = buildOutskirtsInformationHierarchySurface({
    model,
    resolveItemName: (id) => itemsById[id] ?? null,
    killsSinceBoss: 2,
    killsToBoss: 5,
    postureFit: { aiFit: 'good', castingFit: 'good', pouchFit: 'good', warnings: [] },
    postureProfile: 'balanced',
    hasTrackedBounty: true,
    hasFarmTool: true,
    cultivationPath: 'martial',
  });

  assert.equal(surface.roleTag, model.roleTag);
  assert.equal(surface.bestUsedWhen, model.bestUsedWhen);
  assert.equal(surface.boundaryLine, model.boundaryLine);
  assert.match(surface.goldExpectationLine, /^Gold:/);
  assert.match(surface.commonMaterialsLine, /^Common mats:/);
  assert.equal(surface.bossAvailabilityLine, 'Boss in 3 kills.');
  assert.equal(surface.trackedBountyVisible, true);
});

void test('outskirts hierarchy surface resolves boss-ready line and farmer-only recommendation gating', async () => {
  const { model, itemsById } = await loadSurfaceInput();

  const farmerBest = buildOutskirtsInformationHierarchySurface({
    model,
    resolveItemName: (id) => itemsById[id] ?? null,
    killsSinceBoss: 8,
    killsToBoss: 8,
    postureFit: { aiFit: 'good', castingFit: 'good', pouchFit: 'good', warnings: [] },
    postureProfile: 'farmer',
    hasTrackedBounty: false,
    hasFarmTool: true,
    cultivationPath: 'martial',
  });
  assert.equal(farmerBest.bossAvailabilityLine, 'Boss available now.');
  assert.equal(farmerBest.recommendedAiLine, 'Recommended AI: Farmer');

  const farmerNotBest = buildOutskirtsInformationHierarchySurface({
    model,
    resolveItemName: (id) => itemsById[id] ?? null,
    killsSinceBoss: 1,
    killsToBoss: 8,
    postureFit: { aiFit: 'risky', castingFit: 'good', pouchFit: 'good', warnings: ['Farmer AI is under-supported.'] },
    postureProfile: 'farmer',
    hasTrackedBounty: false,
    hasFarmTool: false,
    cultivationPath: 'martial',
  });

  assert.equal(farmerNotBest.recommendedAiLine, null);
  assert.match(farmerNotBest.secondaryPostureLine ?? '', /under-supported/i);
});
