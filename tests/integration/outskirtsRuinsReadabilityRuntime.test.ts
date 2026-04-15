import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs/promises';

test('outskirts and ruins panels mount compact run compass + bounded summary surfaces', async () => {
  const outskirtsPanel = await fs.readFile('src/components/screens/world/buildings/OutskirtsBuildingPanel.tsx', 'utf8');
  const ruinsPanel = await fs.readFile('src/components/screens/world/buildings/RuinsBuildingPanel.tsx', 'utf8');
  const ruinsProgress = await fs.readFile('src/features/ruins/ui/RuinsProgress.tsx', 'utf8');
  const ruinsCtaZone = await fs.readFile('src/features/ruins/ui/RuinsCtaZone.tsx', 'utf8');

  assert.match(outskirtsPanel, /useRunCompassSurface/);
  assert.match(outskirtsPanel, /OutskirtsSummaryCard/);
  assert.match(outskirtsPanel, /TrackedBountyProgressLine/);
  assert.match(outskirtsPanel, /OUTSKIRTS_KILL|OUTSKIRTS_BOSS_KILL/);

  assert.match(ruinsPanel, /useRunCompassSurface/);
  assert.match(ruinsPanel, /RuinsSummaryCard/);
  assert.match(ruinsPanel, /ruinsPanel__centerBand/);
  assert.match(ruinsPanel, /ruinsPanel__scenicCenter/);
  assert.match(ruinsPanel, /RuinsCtaZone/);
  assert.match(ruinsPanel, /section=\"rail\"/);
  assert.match(ruinsPanel, /section=\"utility\"/);
  assert.match(ruinsPanel, /TrackedBountyProgressLine/);
  assert.match(ruinsPanel, /RUINS_ROOM_CLEAR|RUINS_RUN_CLEAR/);
  assert.match(ruinsProgress, /ruins-progress__rail/);
  assert.match(ruinsProgress, /ruins-progress__operations/);
  assert.match(ruinsCtaZone, /deriveRuinsActionState/);
});

test('ruins summary layer avoids raw item id fallback copy leakage', async () => {
  const ruinsPanel = await fs.readFile('src/components/screens/world/buildings/RuinsBuildingPanel.tsx', 'utf8');
  assert.doesNotMatch(ruinsPanel, /leadLocalMaterials\.join\(/);
  assert.match(ruinsPanel, /itemsById\[id\]\?\.name/);
});
