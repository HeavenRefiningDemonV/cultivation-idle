import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs/promises';
import { existsSync } from 'node:fs';

test('outskirts planning owner is pure and legacy readability surfaces are quarantined to active branch', async () => {
  const outskirtsRouter = await fs.readFile('src/components/screens/world/buildings/OutskirtsBuildingPanel.tsx', 'utf8');
  const outskirtsOwner = await fs.readFile('src/features/world/outskirts/OutskirtsScreenOwner.tsx', 'utf8');
  const outskirtsExactScreen = await fs.readFile('src/features/world/outskirts/OutskirtsExactMockupScreen.ts', 'utf8');
  const ruinsPanel = await fs.readFile('src/components/screens/world/buildings/RuinsBuildingPanel.tsx', 'utf8');
  const ruinsSurface = await fs.readFile('src/features/world/ruinsExact/buildRuinsExactSurface.ts', 'utf8');
  const ruinsOwner = await fs.readFile('src/features/world/ruinsExact/RuinsScreenOwner.tsx', 'utf8');

  assert.match(outskirtsRouter, /OutskirtsScreenOwner/);
  assert.doesNotMatch(outskirtsRouter, /OutskirtsLegacyActiveSurface/);
  assert.match(outskirtsRouter, /getOutskirtsModuleViewState/);
  assert.doesNotMatch(outskirtsRouter, /useRunCompassSurface/);
  assert.doesNotMatch(outskirtsRouter, /OutskirtsSummaryCard/);
  assert.doesNotMatch(outskirtsRouter, /TrackedBountyProgressLine/);
  assert.doesNotMatch(outskirtsRouter, /InkCombatShell/);
  assert.doesNotMatch(outskirtsRouter, /InkHealthBar/);
  assert.doesNotMatch(outskirtsRouter, /CombatModuleTopLane/);

  // The exact screen owner now owns BOTH planning and active hunts; the legacy
  // active surface was removed (see outskirtsLegacyActiveOwnershipRemovalContract).
  assert.match(outskirtsOwner, /OutskirtsExactMockupScreen/);
  assert.match(outskirtsOwner, /buildOutskirtsMockupSurfaceFromStores/);
  assert.match(outskirtsOwner, /activityMode/);
  assert.doesNotMatch(outskirtsOwner, /InkCombatShell/);
  assert.doesNotMatch(outskirtsOwner, /useRunCompassSurface/);
  assert.doesNotMatch(outskirtsOwner, /CombatStyles\.scss/);
  assert.doesNotMatch(outskirtsOwner, /OutskirtsSummaryCard/);

  // Legacy active readability surface is fully removed, not merely unreferenced.
  assert.equal(existsSync('src/features/world/outskirts/OutskirtsLegacyActiveSurface.tsx'), false);
  assert.equal(existsSync('src/ui/world/OutskirtsSummaryCard.tsx'), false);

  // Active readability (live summary card, combat theater via center stage) now
  // composes inside the exact screen rather than a separate legacy active surface.
  assert.match(outskirtsExactScreen, /OutskirtsGrindSummaryCard/);
  assert.match(outskirtsExactScreen, /OutskirtsCenterStage/);

  // Ruins panel was cut over to the exact screen owner; readability logic moved
  // into the exact surface builder (see the ruinsExact* contract suite).
  assert.match(ruinsPanel, /RuinsScreenOwner/);
  assert.doesNotMatch(ruinsPanel, /useRunCompassSurface/);
  assert.doesNotMatch(ruinsPanel, /RuinsSummaryCard/);
  assert.doesNotMatch(ruinsPanel, /RuinsCtaZone/);
  assert.match(ruinsOwner, /buildRuinsExactSurfaceFromStores/);
  assert.match(ruinsOwner, /RuinsExactMockupScreen/);
  assert.match(ruinsSurface, /explorationSummary/);
  assert.match(ruinsSurface, /guaranteedAnchor/);
  assert.match(ruinsSurface, /roomRoute/);
  assert.match(ruinsSurface, /primaryAction/);
  assert.match(ruinsSurface, /Continue Exploration/);
  assert.match(ruinsPanel, /FX_STAGE_IDS\.ruins/);
  assert.match(ruinsPanel, /RuinsFxScene/);
});

test('ruins summary layer avoids raw item id fallback copy leakage', async () => {
  const ruinsSurface = await fs.readFile('src/features/world/ruinsExact/buildRuinsExactSurface.ts', 'utf8');
  assert.doesNotMatch(ruinsSurface, /leadLocalMaterials\.join\(/);
  // Item copy resolves through the content catalog with a human-readable fallback,
  // never leaking a raw item id into the surface.
  assert.match(ruinsSurface, /itemsById\.mat_spirit_leaf\?\.name \?\? 'Spirit Leaf'/);
  assert.match(ruinsSurface, /finalAnchorItem\?\.name \?\? 'Core Fragment'/);
});
