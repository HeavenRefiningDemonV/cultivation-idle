import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs/promises';

test('outskirts planning owner is pure and legacy readability surfaces are quarantined to active branch', async () => {
  const outskirtsRouter = await fs.readFile('src/components/screens/world/buildings/OutskirtsBuildingPanel.tsx', 'utf8');
  const outskirtsPlanning = await fs.readFile('src/features/world/outskirts/OutskirtsPlanningOwner.tsx', 'utf8');
  const outskirtsActive = await fs.readFile('src/features/world/outskirts/OutskirtsLegacyActiveSurface.tsx', 'utf8');
  const ruinsPanel = await fs.readFile('src/components/screens/world/buildings/RuinsBuildingPanel.tsx', 'utf8');
  const ruinsProgress = await fs.readFile('src/features/ruins/ui/RuinsProgress.tsx', 'utf8');
  const ruinsCtaZone = await fs.readFile('src/features/ruins/ui/RuinsCtaZone.tsx', 'utf8');

  assert.match(outskirtsRouter, /OutskirtsPlanningOwner/);
  assert.match(outskirtsRouter, /OutskirtsLegacyActiveSurface/);
  assert.match(outskirtsRouter, /getOutskirtsModuleViewState/);
  assert.doesNotMatch(outskirtsRouter, /useRunCompassSurface/);
  assert.doesNotMatch(outskirtsRouter, /OutskirtsSummaryCard/);
  assert.doesNotMatch(outskirtsRouter, /TrackedBountyProgressLine/);
  assert.doesNotMatch(outskirtsRouter, /InkCombatShell/);
  assert.doesNotMatch(outskirtsRouter, /InkHealthBar/);
  assert.doesNotMatch(outskirtsRouter, /CombatModuleTopLane/);

  assert.match(outskirtsPlanning, /OutskirtsExactMockupScreen/);
  assert.match(outskirtsPlanning, /buildOutskirtsMockupSurfaceFromStores/);
  assert.doesNotMatch(outskirtsPlanning, /InkCombatShell/);
  assert.doesNotMatch(outskirtsPlanning, /useRunCompassSurface/);
  assert.doesNotMatch(outskirtsPlanning, /CombatStyles\.scss/);

  assert.match(outskirtsActive, /useRunCompassSurface/);
  assert.match(outskirtsActive, /OutskirtsSummaryCard/);
  assert.match(outskirtsActive, /TrackedBountyProgressLine/);
  assert.match(outskirtsActive, /CombatStyles\.scss/);

  assert.match(ruinsPanel, /useRunCompassSurface/);
  assert.match(ruinsPanel, /RuinsSummaryCard/);
  assert.match(ruinsPanel, /ruinsPanel__centerBand/);
  assert.match(ruinsPanel, /ruinsPanel__scenicCenter/);
  assert.match(ruinsPanel, /RuinsCtaZone/);
  assert.match(ruinsPanel, /section="rail"/);
  assert.match(ruinsPanel, /section="utility"/);
  assert.match(ruinsPanel, /TrackedBountyProgressLine/);
  assert.match(ruinsPanel, /RUINS_ROOM_CLEAR|RUINS_RUN_CLEAR/);
  assert.match(ruinsProgress, /ruins-progress__rail/);
  assert.match(ruinsProgress, /ruins-progress__operations/);
  assert.match(ruinsCtaZone, /deriveRuinsActionState/);
  assert.match(ruinsPanel, /buildRuinsSupportContextSurface/);
  assert.match(ruinsPanel, /onExitHintSelect/);
  assert.match(ruinsPanel, /FX_STAGE_IDS\.ruins/);
  assert.match(ruinsPanel, /RuinsFxScene/);
});

test('ruins summary layer avoids raw item id fallback copy leakage', async () => {
  const ruinsPanel = await fs.readFile('src/components/screens/world/buildings/RuinsBuildingPanel.tsx', 'utf8');
  assert.doesNotMatch(ruinsPanel, /leadLocalMaterials\.join\(/);
  assert.match(ruinsPanel, /itemsById\[id\]\?\.name/);
});
