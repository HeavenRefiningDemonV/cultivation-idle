import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import test from 'node:test';

void test('ruins kit card contract and fixture values are locked', async () => {
  const kit = await fs.readFile('src/features/world/ruinsExact/components/RuinsKitCard.ts', 'utf8');
  const screen = await fs.readFile('src/features/world/ruinsExact/RuinsExactMockupScreen.ts', 'utf8');
  const surface = await fs.readFile('src/features/world/ruinsExact/buildRuinsExactSurface.ts', 'utf8');
  const scss = await fs.readFile('src/features/world/ruinsExact/RuinsExactMockupScreen.scss', 'utf8');

  assert.match(screen, /RuinsKitCard/);
  assert.match(screen, /ruinsExactPage__leftRail/);
  for (const token of ['Ruin Kit','In Ruin','Loadout Set','value: \'1\'','AI Profile','Balanced','Exploration Focus','Materials','HP','131','EVA','10%','RES','3%','Medicine Pouch','0 \/ 20']) assert.equal(surface.includes(token), true);
  assert.match(surface, /slotId: 'weapon'/);
  assert.match(surface, /slotId: 'manual'/);
  assert.match(surface, /slotId: 'ring'/);
  assert.match(surface, /slotId: 'boots'/);
  assert.match(surface, /slotId: 'charm'/);
  assert.match(surface, /slotId: 'talisman'/);

  for (const id of ['ruins-kit-card','ruins-kit-title','ruins-kit-stamp','ruins-kit-pouch-row','ruins-kit-pouch-action','ruins-kit-equipment-grid']) assert.equal(kit.includes(id), true);
  for (const token of ['ruins-kit-setup-row-${row.id}','ruins-kit-survival-row-${row.id}','ruins-kit-equipment-slot-${slot.slotId}']) assert.equal(kit.includes(token), true);

  for (const forbidden of ['outskirtsSetupCard','CombatModuleTopLane','RuinsSummaryCard','RuinsProgress','RuinsCtaZone']) assert.equal(kit.includes(forbidden), false);
  assert.match(scss, /ruinsKitCard__equipmentGrid[\s\S]*repeat\(3,/);
});
