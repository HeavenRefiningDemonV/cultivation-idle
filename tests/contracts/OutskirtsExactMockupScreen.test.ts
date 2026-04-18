import assert from 'node:assert/strict';
import test from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { readFile } from 'node:fs/promises';

import { OutskirtsExactMockupScreen } from '../../src/features/world/outskirts/OutskirtsExactMockupScreen.js';
import { buildOutskirtsMockupSurface } from '../../src/features/world/outskirts/buildOutskirtsMockupSurface.js';
import { createOutskirtsMockupFixture } from '../../src/features/world/outskirts/fixtures/createOutskirtsMockupFixture.js';

void test('P5 setup card structure renders exact sections and six-slot equipment grid', () => {
  const surface = buildOutskirtsMockupSurface(createOutskirtsMockupFixture());
  const html = renderToStaticMarkup(React.createElement(OutskirtsExactMockupScreen, { surface }));

  const count = (token: string) => (html.match(new RegExp(token, 'g')) ?? []).length;

  assert.equal(count('outskirts-setup-card'), 1);
  assert.equal(count('outskirts-setup-title'), 1);
  assert.equal(count('outskirts-setup-primary-rows'), 1);
  assert.equal(count('outskirts-setup-offense'), 1);
  assert.equal(count('outskirts-setup-defense'), 1);
  assert.equal(count('outskirts-setup-pouch'), 1);
  assert.equal(count('outskirts-setup-equipment-grid'), 1);
  assert.equal(count('outskirts-setup-equipment-slot'), 6);
});

void test('P5 setup card visible order is locked', () => {
  const surface = buildOutskirtsMockupSurface(createOutskirtsMockupFixture());
  const html = renderToStaticMarkup(React.createElement(OutskirtsExactMockupScreen, { surface }));

  const order = ['Loadout Set', 'AI Profile', 'Attack Focus', 'Offense', 'Defense', 'Medicine Pouch', 'Equipment'];
  const indices = order.map((token) => html.indexOf(token));
  assert.equal(indices.every((value) => value >= 0), true);
  for (let i = 1; i < indices.length; i += 1) {
    assert.equal(indices[i] > indices[i - 1], true);
  }
});

void test('P5 normalization keeps ACC/EVA/RES rows present', () => {
  const surface = buildOutskirtsMockupSurface(createOutskirtsMockupFixture());
  const html = renderToStaticMarkup(React.createElement(OutskirtsExactMockupScreen, { surface }));

  assert.match(html, />ACC</);
  assert.match(html, />EVA</);
  assert.match(html, />RES</);
});

void test('P5 setup card placeholder stability holds under long labels and partial equipment data', () => {
  const surface = buildOutskirtsMockupSurface(createOutskirtsMockupFixture({
    aiProfileLabel: 'Extremely Long Tactical Profile Name That Must Truncate',
    offenseRows: [
      { id: 'atk', label: 'ATK', value: '—', source: 'synthetic' },
      { id: 'acc', label: 'ACC', value: '—', source: 'synthetic' },
      { id: 'crit', label: 'CRIT', value: '—', source: 'synthetic' },
    ],
    defenseRows: [
      { id: 'hp', label: 'HP', value: '—', source: 'synthetic' },
      { id: 'eva', label: 'EVA', value: '—', source: 'synthetic' },
      { id: 'res', label: 'RES', value: '—', source: 'synthetic' },
    ],
    equipmentGrid: [
      { slotId: 'weapon', label: 'Weapon', iconKey: 'weapon', value: '—', source: 'synthetic' },
      { slotId: 'armor', label: 'Armor', iconKey: 'armor', value: '—', source: 'synthetic' },
      { slotId: 'ring', label: 'Ring', iconKey: 'ring', value: '—', source: 'synthetic' },
      { slotId: 'talisman', label: 'Talisman', iconKey: 'talisman', value: '—', source: 'synthetic' },
      { slotId: 'boots', label: 'Boots', iconKey: 'boots', value: '—', source: 'synthetic' },
      { slotId: 'charm', label: 'Charm', iconKey: 'charm', value: '—', source: 'synthetic' },
    ],
  }));
  const html = renderToStaticMarkup(React.createElement(OutskirtsExactMockupScreen, { surface }));

  assert.equal((html.match(/outskirts-setup-equipment-slot/g) ?? []).length, 6);
  assert.equal(html.includes('outskirts-setup-offense'), true);
  assert.equal(html.includes('outskirts-setup-defense'), true);
});

void test('P5 negative ownership: legacy left summary rail is not visible in exact planning owner', () => {
  const surface = buildOutskirtsMockupSurface(createOutskirtsMockupFixture());
  const html = renderToStaticMarkup(React.createElement(OutskirtsExactMockupScreen, { surface }));

  assert.equal(html.includes('outskirtsPanel__summary'), false);
  assert.equal(html.includes('OutskirtsSummaryCard'), false);
});

void test('P5 preserves World -> WorldBuildingModal -> OutskirtsBuildingPanel route ownership', async () => {
  const modalSource = await readFile(new URL('../../src/components/modals/WorldBuildingModal.tsx', import.meta.url), 'utf8');
  assert.match(modalSource, /case 'outskirts':\s*content = <OutskirtsBuildingPanel cityId=\{storeCityId\} \/>/);

  const panelSource = await readFile(new URL('../../src/components/screens/world/buildings/OutskirtsBuildingPanel.tsx', import.meta.url), 'utf8');
  assert.match(panelSource, /data-testid="outskirts-planning-owner"/);
  assert.match(panelSource, /OutskirtsExactMockupScreen/);
});
