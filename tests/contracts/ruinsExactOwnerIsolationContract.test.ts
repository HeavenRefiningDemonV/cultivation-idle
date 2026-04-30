import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import test from 'node:test';

void test('ruins exact owner isolates legacy ruins panel components', async () => {
  const panel = await fs.readFile('src/components/screens/world/buildings/RuinsBuildingPanel.tsx', 'utf8');
  const owner = await fs.readFile('src/features/world/ruinsExact/RuinsScreenOwner.tsx', 'utf8');
  assert.match(panel, /RuinsScreenOwner/);
  for (const token of [/CombatModuleTopLane/, /RuinsSummaryCard/, /RuinsProgress/, /RuinsCtaZone/, /CombatStyles\.scss/, /combatPathModule/]) assert.doesNotMatch(panel, token);
  assert.match(owner, /buildRuinsExactSurfaceFromStores/);
  assert.match(owner, /RuinsExactMockupScreen/);
  for (const token of [/CombatModuleTopLane/, /RuinsSummaryCard/, /RuinsProgress/, /RuinsCtaZone/]) assert.doesNotMatch(owner, token);
});
