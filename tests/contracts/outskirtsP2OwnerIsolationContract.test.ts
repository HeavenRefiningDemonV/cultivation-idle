import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import test from 'node:test';

void test('P2 planning owner is pure and does not depend on legacy combat-shell surfaces', async () => {
  const router = await fs.readFile('src/components/screens/world/buildings/OutskirtsBuildingPanel.tsx', 'utf8');
  const planningOwner = await fs.readFile('src/features/world/outskirts/OutskirtsPlanningOwner.tsx', 'utf8');

  assert.match(router, /OutskirtsPlanningOwner/);
  assert.match(router, /OutskirtsLegacyActiveSurface/);
  assert.match(router, /getOutskirtsModuleViewState/);

  const forbiddenInRouter = [
    /InkCombatShell/,
    /InkHealthBar/,
    /CombatModuleTopLane/,
    /OutskirtsSummaryCard/,
    /TrackedBountyProgressLine/,
    /buildOutskirtsActionStripState/,
    /buildOutskirtsInformationHierarchySurface/,
    /buildOutskirtsSupportContextSurface/,
    /useRunCompassSurface/,
    /buildOutskirtsFxProfile/,
    /CombatStyles\.scss/,
  ];

  for (const token of forbiddenInRouter) {
    assert.doesNotMatch(router, token);
    assert.doesNotMatch(planningOwner, token);
  }

  assert.match(planningOwner, /OutskirtsExactMockupScreen/);
  assert.match(planningOwner, /buildOutskirtsMockupSurfaceFromStores/);
  assert.match(planningOwner, /data-testid="outskirts-view-planning"/);
});

void test('P2 active-contained branch quarantines legacy combat-shell dependencies', async () => {
  const activeOwner = await fs.readFile('src/features/world/outskirts/OutskirtsLegacyActiveSurface.tsx', 'utf8');

  assert.match(activeOwner, /OutskirtsActiveContainment/);
  assert.match(activeOwner, /data-testid': 'outskirts-view-active-contained'/);
  assert.match(activeOwner, /InkCombatShell/);
  assert.match(activeOwner, /InkHealthBar/);
  assert.match(activeOwner, /CombatModuleTopLane/);
  assert.match(activeOwner, /OutskirtsSummaryCard/);
  assert.match(activeOwner, /TrackedBountyProgressLine/);
  assert.match(activeOwner, /useRunCompassSurface/);
  assert.match(activeOwner, /buildOutskirtsActionStripState/);
  assert.match(activeOwner, /buildOutskirtsInformationHierarchySurface/);
  assert.match(activeOwner, /buildOutskirtsSupportContextSurface/);
  assert.match(activeOwner, /buildOutskirtsFxProfile/);
  assert.match(activeOwner, /CombatStyles\.scss/);
});

void test('P2 route preservation remains World -> WorldBuildingModal -> OutskirtsBuildingPanel', async () => {
  const modalSource = await fs.readFile('src/components/modals/WorldBuildingModal.tsx', 'utf8');
  assert.match(modalSource, /case 'outskirts':\s*content = <OutskirtsBuildingPanel cityId=\{storeCityId\} \/>/);
});
