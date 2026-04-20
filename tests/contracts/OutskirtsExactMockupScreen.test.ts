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

  const setupStart = html.indexOf('data-testid="outskirts-setup-card"');
  const setupEnd = html.indexOf('data-testid="outskirts-rewards-card"');
  const setupRegion = setupStart >= 0 && setupEnd > setupStart ? html.slice(setupStart, setupEnd) : html;

  const order = ['Loadout Set', 'AI Profile', 'Attack Focus', 'Offense', 'Defense', 'Medicine Pouch', 'Equipment'];
  const indices = order.map((token) => setupRegion.indexOf(token));
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
  assert.match(panelSource, /data-testid="outskirts-view-planning"/);
  assert.match(panelSource, /OutskirtsExactMockupScreen/);
});

void test('P7 strip structure renders one progression strip with arrows and six nodes', () => {
  const surface = buildOutskirtsMockupSurface(createOutskirtsMockupFixture());
  const html = renderToStaticMarkup(React.createElement(OutskirtsExactMockupScreen, { surface }));

  const count = (token: string) => (html.match(new RegExp(token, 'g')) ?? []).length;
  assert.equal(count('outskirts-encounter-progress-strip'), 1);
  assert.equal(count('outskirts-encounter-progress-left-arrow'), 1);
  assert.equal(count('outskirts-encounter-progress-right-arrow'), 1);
  const nodeIds = ['quiet-glade', 'rockjaw-boar', 'snarling-wolf', 'venomcoil', 'shade-stalker', 'mire-serpent'];
  for (const nodeId of nodeIds) {
    assert.equal(html.includes(`outskirts-encounter-progress-node-${nodeId}`), true);
  }
});

void test('P7 strip order is locked to Pinewind exact-mockup sequence', () => {
  const surface = buildOutskirtsMockupSurface(createOutskirtsMockupFixture({ selectedEncounterId: 'snarling-wolf' }));
  const labels = surface.encounterProgressStrip.nodes.map((node) => node.label);
  assert.deepEqual(labels, ['Quiet Glade', 'Rockjaw Boar', 'Snarling Wolf', 'Venomcoil', 'Shade Stalker', 'Mire Serpent']);
});

void test('P7 strip state mapping renders completed/current/future classes without legacy bottom utility owners', () => {
  const surface = buildOutskirtsMockupSurface(createOutskirtsMockupFixture({ selectedEncounterId: 'snarling-wolf' }));
  const html = renderToStaticMarkup(React.createElement(OutskirtsExactMockupScreen, { surface }));

  assert.match(html, /outskirtsEncounterProgressStrip__node--completed/);
  assert.match(html, /outskirtsEncounterProgressStrip__node--current/);
  assert.match(html, /outskirtsEncounterProgressStrip__node--future/);

  assert.equal(html.includes('outskirtsActionStrip'), false);
});

void test('P7 strip placeholder stability keeps six fixed nodes when optional level text is missing', () => {
  const surface = buildOutskirtsMockupSurface(createOutskirtsMockupFixture());
  for (const node of surface.encounterProgressStrip.nodes) {
    node.displayLevelText = undefined;
  }
  const html = renderToStaticMarkup(React.createElement(OutskirtsExactMockupScreen, { surface }));
  const nodeIds = ['quiet-glade', 'rockjaw-boar', 'snarling-wolf', 'venomcoil', 'shade-stalker', 'mire-serpent'];
  for (const nodeId of nodeIds) {
    assert.equal(html.includes(`outskirts-encounter-progress-node-${nodeId}`), true);
  }
  assert.equal((html.match(/outskirtsEncounterProgressStrip__thumb/g) ?? []).length, 6);
});

void test('P8 structure renders one encounter strip, one primary CTA, and one grind summary card', () => {
  const surface = buildOutskirtsMockupSurface(createOutskirtsMockupFixture());
  const html = renderToStaticMarkup(React.createElement(OutskirtsExactMockupScreen, { surface }));

  assert.equal((html.match(/outskirts-encounter-progress-strip/g) ?? []).length, 1);
  assert.equal((html.match(/outskirts-start-hunt-cta/g) ?? []).length, 1);
  assert.equal((html.match(/outskirts-grind-summary/g) ?? []).length, 1);
});

void test('P8 single-CTA ownership keeps rewards card CTA-free', () => {
  const surface = buildOutskirtsMockupSurface(createOutskirtsMockupFixture());
  const html = renderToStaticMarkup(React.createElement(OutskirtsExactMockupScreen, { surface }));

  assert.equal((html.match(/outskirts-start-hunt-cta/g) ?? []).length, 1);
  assert.equal(html.includes('outskirts-rewards-card'), true);
  assert.equal(html.includes('outskirtsRewardsCard__cta'), false);
});

void test('P8 grind-summary fallback remains rendered when partial summary data is missing', () => {
  const surface = buildOutskirtsMockupSurface(createOutskirtsMockupFixture());
  surface.grindSummary = { visible: true, title: undefined, runsText: undefined, goldPerHourText: undefined };

  const html = renderToStaticMarkup(React.createElement(OutskirtsExactMockupScreen, { surface }));
  assert.equal(html.includes('outskirts-grind-summary'), true);
  assert.equal(html.includes('outskirtsGrindSummaryCard__row'), true);
});

void test('P8 wiring: planning CTA is forwarded to existing Outskirts start handler path', async () => {
  const panelSource = await readFile(new URL('../../src/components/screens/world/buildings/OutskirtsBuildingPanel.tsx', import.meta.url), 'utf8');
  assert.match(panelSource, /<OutskirtsExactMockupScreen surface=\{planningSurface\} onStartHunt=\{handleStartOutskirts\} \/>/);
  assert.match(panelSource, /const handleStartOutskirts = \(\) =>/);
});

void test('P9 wrapper contains dedicated planning/active/unavailable branches', async () => {
  const panelSource = await readFile(new URL('../../src/components/screens/world/buildings/OutskirtsBuildingPanel.tsx', import.meta.url), 'utf8');
  assert.match(panelSource, /getOutskirtsModuleViewState/);
  assert.match(panelSource, /data-testid=\"outskirts-view-planning\"/);
  assert.match(panelSource, /data-testid=\"outskirts-view-unavailable\"/);
  assert.match(panelSource, /OutskirtsActiveContainment/);
});

void test('P9 no-bleed: exact planning screen still excludes active-combat ownership widgets', () => {
  const surface = buildOutskirtsMockupSurface(createOutskirtsMockupFixture());
  const html = renderToStaticMarkup(React.createElement(OutskirtsExactMockupScreen, { surface }));
  assert.equal(html.includes('ink-combat-shell__healthbar'), false);
  assert.equal(html.includes('ink-combat-shell__log'), false);
  assert.equal(html.includes('outskirtsActiveContainment'), false);
  assert.equal(html.includes('combatPathModule__actionZone'), false);
});

void test('P10 exact-surface smoke: one planning owner for every major region and one dominant CTA', () => {
  const surface = buildOutskirtsMockupSurface(createOutskirtsMockupFixture());
  const html = renderToStaticMarkup(React.createElement(OutskirtsExactMockupScreen, { surface }));

  assert.equal((html.match(/outskirts-exact-page-title/g) ?? []).length, 1);
  assert.equal((html.match(/outskirts-exact-top-progress/g) ?? []).length, 1);
  assert.equal((html.match(/outskirts-exact-tactical-strip/g) ?? []).length, 1);
  assert.equal((html.match(/outskirts-exact-scenic-stage/g) ?? []).length, 1);
  assert.equal((html.match(/outskirts-setup-card/g) ?? []).length, 1);
  assert.equal((html.match(/outskirts-rewards-card/g) ?? []).length, 1);
  assert.equal((html.match(/outskirts-encounter-progress-strip/g) ?? []).length, 1);
  assert.equal((html.match(/outskirts-start-hunt-cta/g) ?? []).length, 1);
  assert.equal((html.match(/outskirts-grind-summary/g) ?? []).length, 1);

  assert.equal(html.includes('runCompassSurface'), false);
  assert.equal(html.includes('combatPathModule__chip'), false);
  assert.equal(html.includes('outskirtsPanel__summary'), false);
  assert.equal(html.includes('Utility Tray'), false);
  assert.equal(html.includes('ink-combat-shell__log'), false);
  assert.equal(html.includes('InkHealthBar'), false);
  assert.equal(html.includes('outskirts-view-active-contained'), false);
});

void test('P10 no-layout-shift contract keeps stable node/card/cta structure across bounty and boss-ready state changes', () => {
  const defaultSurface = buildOutskirtsMockupSurface(createOutskirtsMockupFixture({
    bountyLabel: 'Cull field beasts: 4 / 10',
    killsSinceBoss: 3,
  }));
  const changedSurface = buildOutskirtsMockupSurface(createOutskirtsMockupFixture({
    bountyLabel: null,
    killsSinceBoss: 10,
  }));
  const defaultHtml = renderToStaticMarkup(React.createElement(OutskirtsExactMockupScreen, { surface: defaultSurface }));
  const changedHtml = renderToStaticMarkup(React.createElement(OutskirtsExactMockupScreen, { surface: changedSurface }));

  const tokens = [
    'outskirts-encounter-progress-node-quiet-glade',
    'outskirts-encounter-progress-node-rockjaw-boar',
    'outskirts-encounter-progress-node-snarling-wolf',
    'outskirts-encounter-progress-node-venomcoil',
    'outskirts-encounter-progress-node-shade-stalker',
    'outskirts-encounter-progress-node-mire-serpent',
    'outskirts-rewards-card',
    'outskirts-start-hunt-cta',
    'outskirts-grind-summary',
  ];

  for (const token of tokens) {
    assert.equal(defaultHtml.includes(token), true);
    assert.equal(changedHtml.includes(token), true);
  }
});

void test('Stage1 skeleton owner: planning screen exposes top/body clusters with rail and dock ownership', () => {
  const surface = buildOutskirtsMockupSurface(createOutskirtsMockupFixture());
  const html = renderToStaticMarkup(React.createElement(OutskirtsExactMockupScreen, { surface }));

  const required = [
    'outskirts-exact-top-cluster',
    'outskirts-exact-body-cluster',
    'outskirts-exact-left-rail',
    'outskirts-exact-center-column',
    'outskirts-exact-right-rail',
    'outskirts-exact-summary-dock',
  ];

  for (const token of required) {
    assert.equal(html.includes(token), true, `missing ${token}`);
  }

  assert.equal(html.includes('outskirts-exact-future-scaffold'), false);
});

void test('Stage1 planning owner excludes legacy combat-shell owners from visible planning composition', () => {
  const surface = buildOutskirtsMockupSurface(createOutskirtsMockupFixture());
  const html = renderToStaticMarkup(React.createElement(OutskirtsExactMockupScreen, { surface }));

  assert.equal(html.includes('ink-combat-shell'), false);
  assert.equal(html.includes('combatModuleTopLane'), false);
  assert.equal(html.includes('runCompassSurface'), false);
  assert.equal(html.includes('outskirtsPanel__summary'), false);
  assert.equal(html.includes('tracked-bounty-progress-line'), false);
});

void test('Stage1 top-level copy contract locks title/plaque/subtitle and tactical AI Profile label', () => {
  const surface = buildOutskirtsMockupSurface(createOutskirtsMockupFixture());
  const html = renderToStaticMarkup(React.createElement(OutskirtsExactMockupScreen, { surface }));

  assert.equal(html.includes('data-testid="outskirts-exact-page-title">Outskirts<'), true);
  assert.equal(html.includes('data-testid="outskirts-exact-area-plaque">Outskirts<'), true);
  assert.equal(html.includes('data-testid="outskirts-exact-subtitle">Gold and common materials<'), true);
  assert.equal(html.includes('outskirtsExactPage__tacticalLabel">AI Profile<'), true);
  assert.equal(html.includes('Area: Training Forest'), false);
  assert.equal(html.includes('Calm the route before committing the next hunt.'), false);
});

void test('Stage1 desktop geometry contract: center column dominates and rails stop before CTA row', async () => {
  const stylesheet = await readFile(new URL('../../src/features/world/outskirts/OutskirtsExactMockupScreen.scss', import.meta.url), 'utf8');

  assert.match(stylesheet, /grid-template-columns:\s*220px 28px minmax\(0, 1fr\) 28px 220px;/);
  assert.match(stylesheet, /grid-template-rows:\s*300px 40px 92px 78px;/);
  assert.match(stylesheet, /\.outskirtsExactPage__centerColumn\s*\{[\s\S]*grid-column:\s*3;[\s\S]*grid-row:\s*1 \/ 5;/);
  assert.match(stylesheet, /\.outskirtsExactPage__leftRail\s*\{[\s\S]*grid-row:\s*1 \/ 4;/);
  assert.match(stylesheet, /\.outskirtsExactPage__rightRail\s*\{[\s\S]*grid-row:\s*1 \/ 4;/);
});

void test('Stage1 summary ownership contract keeps grind summary in lower-right dock, not inside right rail stack', () => {
  const surface = buildOutskirtsMockupSurface(createOutskirtsMockupFixture());
  const html = renderToStaticMarkup(React.createElement(OutskirtsExactMockupScreen, { surface }));

  const rightRailIdx = html.indexOf('data-testid="outskirts-exact-right-rail"');
  const summaryDockIdx = html.indexOf('data-testid="outskirts-exact-summary-dock"');
  const rewardsCardIdx = html.indexOf('data-testid="outskirts-rewards-card"');
  const grindSummaryIdx = html.indexOf('data-testid="outskirts-grind-summary"');

  assert.equal(rightRailIdx >= 0, true);
  assert.equal(summaryDockIdx >= 0, true);
  assert.equal(rewardsCardIdx > rightRailIdx, true);
  assert.equal(grindSummaryIdx > summaryDockIdx, true);
  assert.equal(grindSummaryIdx > rewardsCardIdx, true);
});
