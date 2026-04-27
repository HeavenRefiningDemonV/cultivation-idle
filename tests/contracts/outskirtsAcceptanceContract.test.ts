import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';

import { validateLoadedContent } from '../../src/content/index.js';
import {
  OUTSKIRTS_BOUNDARY_LINE,
  OUTSKIRTS_ROLE_TAG,
  buildOutskirtsActivityRewardReadModel,
} from '../../src/systems/economy/activityRewardReadModel.js';
import { buildOutskirtsInformationHierarchySurface } from '../../src/ui/world/buildOutskirtsInformationHierarchySurface.js';
import { buildOutskirtsSupportContextSurface } from '../../src/ui/world/buildOutskirtsSupportContextSurface.js';
import { loadRawProgressionContent } from '../fixtures/progression/loadFixtureContext.js';

void test('outskirts acceptance path keeps canonical role/use/boundary truth visible', async () => {
  const content = validateLoadedContent((await loadRawProgressionContent()) as never);
  const cityId = content.cities[0]?.id ?? 'city_pinewind_hamlet';
  const model = buildOutskirtsActivityRewardReadModel(content, cityId);
  const itemsById = Object.fromEntries(content.items.map((item) => [item.id, item.name]));

  const surface = buildOutskirtsInformationHierarchySurface({
    model,
    resolveItemName: (id) => itemsById[id] ?? null,
    killsSinceBoss: 2,
    killsToBoss: 7,
    postureFit: { aiFit: 'good', castingFit: 'good', pouchFit: 'good', warnings: [] },
    postureProfile: 'farmer',
    hasTrackedBounty: true,
    hasFarmTool: true,
    cultivationPath: 'martial',
  });

  assert.equal(surface.roleTag, OUTSKIRTS_ROLE_TAG);
  assert.equal(surface.boundaryLine, OUTSKIRTS_BOUNDARY_LINE);
  assert.match(surface.bestUsedWhen, /gold|common materials|low-risk/i);
  assert.match(surface.goldExpectationLine, /^Gold:/);
  assert.match(surface.commonMaterialsLine, /^Common mats:/);
  assert.match(surface.boundaryLine, /not the best source/i);
});

void test('outskirts support context only emits adjacent route modules and keeps count compact', () => {
  const surface = buildOutskirtsSupportContextSurface({
    trackedOutskirtsBounty: null,
    farmerRecommendationLine: null,
    cityId: 'city_pinewind_hamlet',
    runCompassActions: [
      {
        id: 'ruins',
        label: 'Run Ruins',
        why: 'Need targeted local mats',
        destinationLabel: 'Ruins',
        blocked: false,
        blockedReason: null,
        target: { kind: 'world_module', cityId: 'city_pinewind_hamlet', moduleKey: 'ruins' },
      },
      {
        id: 'gate',
        label: 'Gate Trial',
        why: 'Should be filtered out for outskirts adjacency',
        destinationLabel: 'Gate Trial',
        blocked: false,
        blockedReason: null,
        target: { kind: 'world_module', cityId: 'city_pinewind_hamlet', moduleKey: 'gateTrial' },
      },
    ],
  });

  assert.equal(surface.routeHints.length, 1);
  assert.equal(surface.routeHints[0]?.destination, 'ruins');
});

void test('outskirts screen owner is routed through dedicated exact owner component', async () => {
  const panelSource = await readFile(new URL('../../src/components/screens/world/buildings/OutskirtsBuildingPanel.tsx', import.meta.url), 'utf8');
  const ownerSource = await readFile(new URL('../../src/features/world/outskirts/OutskirtsScreenOwner.tsx', import.meta.url), 'utf8');
  assert.match(panelSource, /OutskirtsScreenOwner/);
  assert.doesNotMatch(panelSource, /OutskirtsLegacyActiveSurface/);
  assert.match(ownerSource, /buildOutskirtsMockupSurfaceFromStores/);
  assert.match(ownerSource, /OutskirtsExactMockupScreen/);
  assert.match(ownerSource, /data-testid="outskirts-view-screen"/);
});
