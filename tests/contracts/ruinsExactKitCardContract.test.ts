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
  for (const token of ['ruins-kit-setup-row-${row.id}','ruins-kit-stat-row-${row.id}','ruins-kit-equipment-slot-${slot.slotId}']) assert.equal(kit.includes(token), true);


  const kitHtmlTokens = ['Ruin Kit','In Ruin','Loadout Set','AI Profile','Exploration Focus','Offense','Defense','ATK','ACC','CRT','HP','EVA','RES','Medicine Pouch','0 / 20'];
  for (const token of kitHtmlTokens) assert.equal(surface.includes(token) || kit.includes(token), true);

  for (const selector of ['.ruinsKitCard', '.ruinsKitCard::before', '.ruinsKitCard__header', '.ruinsKitCard__title', '.ruinsKitCard__stamp', '.ruinsKitCard__setupRows', '.ruinsKitCard__setupRow', '.ruinsKitCard__iconDock', '.ruinsKitCard__rowLabel', '.ruinsKitCard__rowValue', '.ruinsKitCard__rowAction', '.ruinsKitCard__section', '.ruinsKitCard__sectionTitle', '.ruinsKitCard__statRow', '.ruinsKitCard__pouchRow', '.ruinsKitCard__pouchValue', '.ruinsKitCard__pouchAction', '.ruinsKitCard__equipmentGrid', '.ruinsKitCard__equipmentCell', '.ruinsKitCard__equipmentIcon', '.ruinsKitCard__sr']) assert.equal(scss.includes(selector), true);

  for (const sizingGuard of ['.ruinsKitCard__iconDock img', 'width:clamp(14px,.88vw,18px)', 'height:clamp(14px,.88vw,18px)', 'max-width:clamp(14px,.88vw,18px)', 'max-height:clamp(14px,.88vw,18px)', 'object-fit:contain', '.ruinsKitCard__equipmentIcon', 'width:clamp(30px,2.05vw,38px)', 'height:clamp(30px,2.05vw,38px)', 'max-width:clamp(30px,2.05vw,38px)', 'max-height:clamp(30px,2.05vw,38px)']) assert.equal(scss.includes(sizingGuard), true);
  assert.equal(scss.includes('object-fit:cover'), false);

  for (const forbidden of ['outskirtsSetupCard','CombatModuleTopLane','RuinsSummaryCard','RuinsProgress','RuinsCtaZone']) assert.equal(kit.includes(forbidden), false);
  assert.match(scss, /ruinsKitCard__equipmentGrid[\s\S]*repeat\(3,/);
});
