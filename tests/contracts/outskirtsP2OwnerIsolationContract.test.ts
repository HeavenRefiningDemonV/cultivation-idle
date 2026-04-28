import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import test from 'node:test';

void test('P2 router uses OutskirtsScreenOwner for all available states', async () => {
  const router = await fs.readFile('src/components/screens/world/buildings/OutskirtsBuildingPanel.tsx', 'utf8');
  const screenOwner = await fs.readFile('src/features/world/outskirts/OutskirtsScreenOwner.tsx', 'utf8');
  const planningOwner = await fs.readFile('src/features/world/outskirts/OutskirtsPlanningOwner.tsx', 'utf8');

  assert.match(router, /OutskirtsScreenOwner/);
  assert.doesNotMatch(router, /lazy\(/);
  assert.doesNotMatch(router, /Suspense/);
  assert.doesNotMatch(router, /OutskirtsLegacyActiveSurface/);
  assert.match(router, /if \(viewState === 'unavailable'\)/);
  assert.match(router, /return <OutskirtsScreenOwner cityId=\{cityId\} \/>/);

  const forbidden = [
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

  for (const token of forbidden) {
    assert.doesNotMatch(router, token);
    assert.doesNotMatch(screenOwner, token);
  }

  assert.match(screenOwner, /OutskirtsExactMockupScreen/);
  assert.match(screenOwner, /buildOutskirtsMockupSurfaceFromStores/);
  assert.match(screenOwner, /data-testid="outskirts-view-screen"/);
  assert.match(planningOwner, /OutskirtsScreenOwner as OutskirtsPlanningOwner/);
});

void test('P2 legacy active surface and helper files are removed', async () => {
  const router = await fs.readFile('src/components/screens/world/buildings/OutskirtsBuildingPanel.tsx', 'utf8');

  assert.doesNotMatch(router, /OutskirtsLegacyActiveSurface/);
  const removed = [
    'src/features/world/outskirts/OutskirtsLegacyActiveSurface.tsx',
    'src/features/world/outskirts/components/OutskirtsActiveContainment.tsx',
    'src/features/world/outskirts/components/OutskirtsActiveContainment.scss',
    'src/ui/world/OutskirtsSummaryCard.tsx',
    'src/ui/world/buildOutskirtsActionStripState.ts',
    'src/ui/world/buildOutskirtsInformationHierarchySurface.ts',
    'src/ui/world/buildOutskirtsSupportContextSurface.ts',
    'src/ui/world/buildOutskirtsFxProfile.ts',
  ];
  for (const path of removed) {
    await assert.rejects(fs.readFile(path, 'utf8'));
  }
});

void test('P2 route preservation remains World -> WorldBuildingModal -> OutskirtsBuildingPanel', async () => {
  const modalSource = await fs.readFile('src/components/modals/WorldBuildingModal.tsx', 'utf8');
  assert.match(modalSource, /case 'outskirts':\s*content = <OutskirtsBuildingPanel cityId=\{storeCityId\} \/>/);
});
