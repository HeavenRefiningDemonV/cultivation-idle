import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs/promises';

test('outskirts and ruins panels mount compact run compass + bounded summary surfaces', async () => {
  const outskirtsPanel = await fs.readFile('src/components/screens/world/buildings/OutskirtsBuildingPanel.tsx', 'utf8');
  const ruinsPanel = await fs.readFile('src/components/screens/world/buildings/RuinsBuildingPanel.tsx', 'utf8');

  assert.match(outskirtsPanel, /RunCompassCompact/);
  assert.match(outskirtsPanel, /OutskirtsSummaryCard/);
  assert.match(outskirtsPanel, /TrackedBountyProgressLine/);
  assert.match(outskirtsPanel, /OUTSKIRTS_KILL|OUTSKIRTS_BOSS_KILL/);

  assert.match(ruinsPanel, /RunCompassCompact/);
  assert.match(ruinsPanel, /RuinsSummaryCard/);
  assert.match(ruinsPanel, /TrackedBountyProgressLine/);
  assert.match(ruinsPanel, /RUINS_ROOM_CLEAR|RUINS_RUN_CLEAR/);
});

test('ruins summary layer avoids raw item id fallback copy leakage', async () => {
  const ruinsPanel = await fs.readFile('src/components/screens/world/buildings/RuinsBuildingPanel.tsx', 'utf8');
  assert.doesNotMatch(ruinsPanel, /leadLocalMaterials\.join\(/);
  assert.match(ruinsPanel, /itemsById\[id\]\?\.name/);
});
