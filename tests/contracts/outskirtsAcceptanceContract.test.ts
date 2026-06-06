import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';

import { validateLoadedContent } from '../../src/content/index.js';
import {
  OUTSKIRTS_BOUNDARY_LINE,
  OUTSKIRTS_ROLE_TAG,
  buildOutskirtsActivityRewardReadModel,
} from '../../src/systems/economy/activityRewardReadModel.js';
import { loadRawProgressionContent } from '../fixtures/progression/loadFixtureContext.js';

void test('outskirts acceptance path keeps canonical role/use/boundary truth visible', async () => {
  const content = validateLoadedContent((await loadRawProgressionContent()) as never);
  const cityId = content.cities[0]?.id ?? 'city_pinewind_hamlet';
  const model = buildOutskirtsActivityRewardReadModel(content, cityId);
  assert.equal(model.roleTag, OUTSKIRTS_ROLE_TAG);
  assert.equal(model.boundaryLine, OUTSKIRTS_BOUNDARY_LINE);
  assert.match(model.bestUsedWhen, /gold|common materials|low-risk/i);
  assert.match(model.boundaryLine, /not the best source/i);
});

void test('outskirts screen owner is routed through dedicated exact owner component', async () => {
  const panelSource = await readFile('src/components/screens/world/buildings/OutskirtsBuildingPanel.tsx', 'utf8');
  const ownerSource = await readFile('src/features/world/outskirts/OutskirtsScreenOwner.tsx', 'utf8');
  assert.match(panelSource, /OutskirtsScreenOwner/);
  assert.doesNotMatch(panelSource, /OutskirtsLegacyActiveSurface/);
  assert.match(ownerSource, /buildOutskirtsMockupSurfaceFromStores/);
  assert.match(ownerSource, /OutskirtsExactMockupScreen/);
  assert.match(ownerSource, /data-testid="outskirts-view-screen"/);
});
