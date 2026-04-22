import assert from 'node:assert/strict';
import test from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { readFile } from 'node:fs/promises';

import { OutskirtsExactMockupScreen } from '../../src/features/world/outskirts/OutskirtsExactMockupScreen.js';
import { buildOutskirtsMockupSurface } from '../../src/features/world/outskirts/buildOutskirtsMockupSurface.js';
import { createOutskirtsMockupFixture } from '../../src/features/world/outskirts/fixtures/createOutskirtsMockupFixture.js';

void test('P5 top region structure renders title/ribbon/strip/plaque/subtitle/settings', () => {
  const surface = buildOutskirtsMockupSurface(createOutskirtsMockupFixture());
  const html = renderToStaticMarkup(React.createElement(OutskirtsExactMockupScreen, { surface }));

  assert.equal((html.match(/outskirts-top-region/g) ?? []).length, 1);
  assert.equal((html.match(/outskirts-page-title/g) ?? []).length, 1);
  assert.equal((html.match(/outskirts-macro-ribbon/g) ?? []).length, 1);
  assert.equal((html.match(/outskirts-tactical-strip/g) ?? []).length, 1);
  assert.equal((html.match(/outskirts-area-plaque/g) ?? []).length, 1);
  assert.equal((html.match(/outskirts-page-subtitle/g) ?? []).length, 1);
  assert.equal((html.match(/outskirts-settings-gear/g) ?? []).length, 1);
  assert.equal((html.match(/outskirts-tactical-cell-/g) ?? []).length, 7);
});

void test('P5 tactical strip order and review values are locked', () => {
  const surface = buildOutskirtsMockupSurface(createOutskirtsMockupFixture());
  const html = renderToStaticMarkup(React.createElement(OutskirtsExactMockupScreen, { surface }));

  const order = ['hp', 'danger', 'loadout', 'aiProfile', 'healing', 'bounty', 'expedition'];
  const indices = order.map((id) => html.indexOf(`outskirts-tactical-cell-${id}`));
  assert.equal(indices.every((i) => i >= 0), true);
  for (let i = 1; i < indices.length; i += 1) assert.equal(indices[i] > indices[i - 1], true);

  assert.equal(html.includes('2,860 / 3,120'), true);
  assert.equal(html.includes('Low · Lv. 11'), true);
  assert.equal(html.includes('Set 2'), true);
  assert.equal(html.includes('Balanced'), true);
  assert.equal(html.includes('12 / 20'), true);
  assert.equal(html.includes('Wolf Pelt 7/15'), true);
  assert.equal(html.includes('2 Idle'), true);
});

void test('P5 plaque renders dropdown affordance', () => {
  const surface = buildOutskirtsMockupSurface(createOutskirtsMockupFixture());
  const html = renderToStaticMarkup(React.createElement(OutskirtsExactMockupScreen, { surface }));

  assert.equal(html.includes('outskirtsTopRegion__plaqueCaret'), true);
  assert.equal(html.includes('outskirts-page-subtitle">Gold and common materials<'), true);
});

void test('P5 planning state excludes legacy combat-shell owners', () => {
  const surface = buildOutskirtsMockupSurface(createOutskirtsMockupFixture());
  const html = renderToStaticMarkup(React.createElement(OutskirtsExactMockupScreen, { surface }));

  assert.equal(html.includes('runCompassSurface'), false);
  assert.equal(html.includes('combatPathModule__chip'), false);
  assert.equal(html.includes('utilityTrayShell'), false);
  assert.equal(html.includes('ink-combat-shell__log'), false);
  assert.equal(html.includes('ink-combat-shell__healthbar'), false);
});

void test('P6 scenic center renders as composition surface with no visible descriptor fallback text', () => {
  const fixture = createOutskirtsMockupFixture();
  const surface = buildOutskirtsMockupSurface(fixture);
  const html = renderToStaticMarkup(React.createElement(OutskirtsExactMockupScreen, { surface }));

  assert.equal((html.match(/outskirts-exact-scenic-stage/g) ?? []).length, 1);
  assert.equal((html.match(/outskirts-exact-scenic-image/g) ?? []).length, 1);
  assert.equal((html.match(/outskirts-exact-encounter-identity-row/g) ?? []).length, 1);
  assert.equal(html.includes('outskirtsScenicStage__plate'), true);
  assert.equal(html.includes('outskirtsScenicStage__fallback">'), false);
  assert.equal(html.includes(`>${fixture.encounterDescriptor}<`), false);
});

void test('P6 review fixture identity remains target-faithful and does not render watch control', () => {
  const surface = buildOutskirtsMockupSurface(createOutskirtsMockupFixture());
  const html = renderToStaticMarkup(React.createElement(OutskirtsExactMockupScreen, { surface }));

  assert.equal(html.includes('outskirts-exact-encounter-name">Snarling Wolf<'), true);
  assert.equal(html.includes('outskirts-exact-encounter-level">Lv. 11<'), true);
  assert.equal(html.includes('outskirts-exact-encounter-safe-chip">Safe<'), true);
  assert.equal(html.includes('Watch'), false);
  assert.equal(html.includes('/assets/mockups/ChatGPT Image Apr 17, 2026, 04_24_04 PM.png'), true);
});

void test('P6 scenic placeholder suppression keeps stage rendered when scenic image source is absent', () => {
  const surface = buildOutskirtsMockupSurface(createOutskirtsMockupFixture());
  surface.scenicStage.scenicImageSrc = null;
  surface.scenicStage.reviewFixtureImageSrc = null;
  surface.scenicStage.useApprovedMockupCrop = false;
  const html = renderToStaticMarkup(React.createElement(OutskirtsExactMockupScreen, { surface }));

  assert.equal((html.match(/outskirts-exact-scenic-stage/g) ?? []).length, 1);
  assert.equal((html.match(/outskirts-exact-scenic-image/g) ?? []).length, 1);
  assert.equal(html.includes('outskirtsScenicStage__fallback">'), false);
  assert.equal(html.includes(`>${surface.scenicStage.environmentDescriptor}<`), false);
});

void test('P6 no-scope-widening smoke: side cards, strip, CTA, and summary owners remain mounted', () => {
  const surface = buildOutskirtsMockupSurface(createOutskirtsMockupFixture());
  const html = renderToStaticMarkup(React.createElement(OutskirtsExactMockupScreen, { surface }));

  const unchangedOwners = [
    'outskirts-setup-card',
    'outskirts-rewards-card',
    'outskirts-encounter-progress-strip',
    'outskirts-start-hunt-cta',
    'outskirts-grind-summary',
  ];
  for (const token of unchangedOwners) assert.equal(html.includes(token), true);
});

void test('P7 setup-card structure renders exact ordered sections and six equipment slots', () => {
  const surface = buildOutskirtsMockupSurface(createOutskirtsMockupFixture());
  const html = renderToStaticMarkup(React.createElement(OutskirtsExactMockupScreen, { surface }));

  assert.equal((html.match(/outskirts-exact-setup-card/g) ?? []).length, 1);
  assert.equal((html.match(/outskirts-exact-setup-title/g) ?? []).length, 1);
  assert.equal((html.match(/outskirts-exact-setup-primary/g) ?? []).length, 3);
  assert.equal((html.match(/outskirts-exact-setup-offense/g) ?? []).length, 1);
  assert.equal((html.match(/outskirts-exact-setup-defense/g) ?? []).length, 1);
  assert.equal((html.match(/outskirts-exact-setup-pouch/g) ?? []).length, 1);
  assert.equal((html.match(/outskirts-exact-setup-equipment-grid/g) ?? []).length, 1);
  assert.equal((html.match(/outskirts-exact-setup-equipment-slot/g) ?? []).length, 6);

  for (const token of ['Your Setup', 'Loadout Set', 'AI Profile', 'Attack Focus', 'Offense', 'Defense', 'Medicine Pouch', 'Equipment']) {
    assert.equal(html.includes(token), true);
  }
});

void test('P7 review fixture setup values remain locked to approved target', () => {
  const surface = buildOutskirtsMockupSurface(createOutskirtsMockupFixture());
  const html = renderToStaticMarkup(React.createElement(OutskirtsExactMockupScreen, { surface }));

  assert.equal(html.includes('Loadout Set'), true);
  assert.equal(html.includes('AI Profile'), true);
  assert.equal(html.includes('Attack Focus'), true);
  assert.equal(html.includes('>2<'), true);
  assert.equal(html.includes('Balanced'), true);
  assert.equal(html.includes('>318<'), true);
  assert.equal(html.includes('>92%<'), true);
  assert.equal(html.includes('>18%<'), true);
  assert.equal(html.includes('>3,120<'), true);
  assert.equal(html.includes('>84%<'), true);
  assert.equal(html.includes('>76%<'), true);
  assert.equal(html.includes('12 / 20'), true);
});

void test('P7 equipment grid remains six icon-first slots in live partial-truth mode', () => {
  const liveLikeSurface = buildOutskirtsMockupSurface(createOutskirtsMockupFixture({
    sourceMode: 'stores',
    equipmentGrid: [
      { slotId: 'weapon', label: 'Weapon', iconKey: 'weapon', value: 'Rusty Sword', source: 'live' },
      { slotId: 'armor', label: 'Armor', iconKey: 'armor', value: '—', source: 'synthetic' },
      { slotId: 'ring', label: 'Ring', iconKey: 'ring', value: 'Prayer Beads', source: 'derived' },
      { slotId: 'talisman', label: 'Talisman', iconKey: 'talisman', value: '—', source: 'synthetic' },
      { slotId: 'boots', label: 'Boots', iconKey: 'boots', value: '—', source: 'synthetic' },
      { slotId: 'charm', label: 'Charm', iconKey: 'charm', value: '—', source: 'synthetic' },
    ],
  }));
  const html = renderToStaticMarkup(React.createElement(OutskirtsExactMockupScreen, { surface: liveLikeSurface }));

  assert.equal((html.match(/outskirts-exact-setup-equipment-slot/g) ?? []).length, 6);
  assert.equal(html.includes('outskirtsSetupCard__equipmentLabel'), false);
  assert.equal(html.includes('◦'), false);
});

void test('P8 rewards-card renders icon-first shell with ordered sections', () => {
  const surface = buildOutskirtsMockupSurface(createOutskirtsMockupFixture());
  const html = renderToStaticMarkup(React.createElement(OutskirtsExactMockupScreen, { surface }));

  assert.equal((html.match(/outskirts-exact-rewards-card/g) ?? []).length, 1);
  assert.equal((html.match(/outskirts-exact-rewards-title/g) ?? []).length, 1);
  assert.equal((html.match(/outskirts-exact-rewards-gold/g) ?? []).length, 1);
  assert.equal((html.match(/outskirts-exact-rewards-materials/g) ?? []).length, 1);
  assert.equal((html.match(/outskirts-exact-rewards-material-item/g) ?? []).length, 4);
  assert.equal((html.match(/outskirts-exact-rewards-bounty/g) ?? []).length, 1);
  assert.equal((html.match(/outskirts-exact-rewards-efficiency/g) ?? []).length, 1);
  assert.equal((html.match(/outskirts-exact-rewards-auto-repeat/g) ?? []).length, 1);
});

void test('P8 review fixture reward values remain exact and visible', () => {
  const surface = buildOutskirtsMockupSurface(createOutskirtsMockupFixture());
  const html = renderToStaticMarkup(React.createElement(OutskirtsExactMockupScreen, { surface }));

  for (const token of ['Expected Rewards', 'Gold', '1,250 – 1,480', 'Common Materials', 'Wolf Pelt', 'Beast Bone', 'Green Herb', 'Spirit Stone']) {
    assert.equal(html.includes(token), true);
  }
  for (const token of ['Tracked Bounty', 'Defeat wolves in the Outskirts', '7 / 15', 'Estimated Efficiency', '~45s / run', '1,800 – 2,000 / hour', 'Auto-Repeat', '>On<']) {
    assert.equal(html.includes(token), true);
  }
  assert.equal((html.match(/outskirts-exact-rewards-bounty-progress/g) ?? []).length, 1);
  assert.match(html, /outskirtsRewardsCard__bountyProgressFill" style="width:46\.666666666666664%"/);
});

void test('P8 tracked bounty section keeps progress geometry when bounty is empty', () => {
  const surface = buildOutskirtsMockupSurface(createOutskirtsMockupFixture({
    trackedBountyTitle: 'None',
    trackedBountyProgress: '0 / 0',
  }));
  const html = renderToStaticMarkup(React.createElement(OutskirtsExactMockupScreen, { surface }));

  assert.equal((html.match(/outskirts-exact-rewards-bounty-progress/g) ?? []).length, 1);
  assert.equal(html.includes('outskirtsRewardsCard__bountyProgress--empty'), true);
  assert.match(html, /outskirtsRewardsCard__bountyProgressFill" style="width:0%"/);
});

void test('P9 encounter strip renders one lane, arrows, six nodes, and distinct states', () => {
  const surface = buildOutskirtsMockupSurface(createOutskirtsMockupFixture());
  const html = renderToStaticMarkup(React.createElement(OutskirtsExactMockupScreen, { surface }));

  assert.equal((html.match(/outskirts-exact-encounter-strip/g) ?? []).length, 1);
  assert.equal((html.match(/outskirts-exact-encounter-strip-left-arrow/g) ?? []).length, 1);
  assert.equal((html.match(/outskirts-exact-encounter-strip-right-arrow/g) ?? []).length, 1);
  assert.equal((html.match(/outskirts-exact-encounter-strip-node/g) ?? []).length, 6);
  assert.equal((html.match(/outskirts-exact-encounter-strip-node-current/g) ?? []).length, 1);
  assert.equal((html.match(/outskirts-exact-encounter-strip-node-completed/g) ?? []).length, 2);
  assert.equal((html.match(/outskirts-exact-encounter-strip-node-future/g) ?? []).length, 3);
  assert.equal(html.includes('data-state="completed"'), true);
  assert.equal(html.includes('data-state="current"'), true);
  assert.equal(html.includes('data-state="future"'), true);
});

void test('P9 review fixture strip order, levels, and states remain locked to approved target', () => {
  const surface = buildOutskirtsMockupSurface(createOutskirtsMockupFixture());
  const html = renderToStaticMarkup(React.createElement(OutskirtsExactMockupScreen, { surface }));

  const ordered = [
    'data-node-id="quiet-glade"',
    'Quiet Glade',
    'Lv. 8',
    'data-node-id="rockjaw-boar"',
    'Rockjaw Boar',
    'Lv. 9',
    'data-node-id="snarling-wolf"',
    'Snarling Wolf',
    'Lv. 11',
    'data-node-id="venomcoil"',
    'Venomcoil',
    'Lv. 13',
    'data-node-id="shade-stalker"',
    'Shade Stalker',
    'Lv. 15',
    'data-node-id="mire-serpent"',
    'Mire Serpent',
    'Lv. 17',
  ];
  for (const token of ordered) assert.equal(html.includes(token), true);

  assert.match(html, /data-node-id="quiet-glade"[\s\S]*?data-state="completed"/);
  assert.match(html, /data-node-id="rockjaw-boar"[\s\S]*?data-state="completed"/);
  assert.match(html, /data-node-id="snarling-wolf"[\s\S]*?data-state="current"/);
  assert.match(html, /data-node-id="venomcoil"[\s\S]*?data-state="future"/);
  assert.match(html, /data-node-id="shade-stalker"[\s\S]*?data-state="future"/);
  assert.match(html, /data-node-id="mire-serpent"[\s\S]*?data-state="future"/);
});

void test('P9 encounter strip visual-state stability keeps lane footprint with mixed art availability', () => {
  const surface = buildOutskirtsMockupSurface(createOutskirtsMockupFixture());
  surface.encounterStrip.nodes = surface.encounterStrip.nodes.map((node, idx) => ({
    ...node,
    imageSrc: idx % 2 === 0 ? null : node.imageSrc ?? null,
    silhouetteImageSrc: idx % 2 === 1 ? null : node.silhouetteImageSrc ?? null,
  }));
  const html = renderToStaticMarkup(React.createElement(OutskirtsExactMockupScreen, { surface }));

  assert.equal((html.match(/outskirts-exact-encounter-strip-node/g) ?? []).length, 6);
  assert.equal((html.match(/outskirts-exact-encounter-strip-left-arrow/g) ?? []).length, 1);
  assert.equal((html.match(/outskirts-exact-encounter-strip-right-arrow/g) ?? []).length, 1);
  assert.equal(html.includes('outskirtsEncounterProgressStrip__lane'), true);
  assert.equal(html.includes('outskirtsEncounterProgressStrip__thumb--current'), true);
});

void test('P5 top region element count remains stable across fixture/live and bounty/expedition shifts', () => {
  const fixtureSurface = buildOutskirtsMockupSurface(createOutskirtsMockupFixture());
  const liveLikeSurface = buildOutskirtsMockupSurface(createOutskirtsMockupFixture({
    sourceMode: 'stores',
    bountyLabel: null,
    expeditionLabel: 'No expedition',
  }));
  const fixtureHtml = renderToStaticMarkup(React.createElement(OutskirtsExactMockupScreen, { surface: fixtureSurface }));
  const liveLikeHtml = renderToStaticMarkup(React.createElement(OutskirtsExactMockupScreen, { surface: liveLikeSurface }));

  const tokens = ['outskirts-top-region', 'outskirts-page-title', 'outskirts-macro-ribbon', 'outskirts-tactical-strip', 'outskirts-area-plaque', 'outskirts-page-subtitle', 'outskirts-settings-gear'];
  for (const token of tokens) {
    assert.equal((fixtureHtml.match(new RegExp(token, 'g')) ?? []).length, 1);
    assert.equal((liveLikeHtml.match(new RegExp(token, 'g')) ?? []).length, 1);
  }
  assert.equal((fixtureHtml.match(/outskirts-tactical-cell-/g) ?? []).length, 7);
  assert.equal((liveLikeHtml.match(/outskirts-tactical-cell-/g) ?? []).length, 7);
});

void test('P4/P5 route preservation: World modal route still mounts Outskirts planning owner', async () => {
  const modalSource = await readFile(new URL('../../src/components/modals/WorldBuildingModal.tsx', import.meta.url), 'utf8');
  const panelSource = await readFile(new URL('../../src/components/screens/world/buildings/OutskirtsBuildingPanel.tsx', import.meta.url), 'utf8');

  assert.match(modalSource, /case 'outskirts':\s*content = <OutskirtsBuildingPanel cityId=\{storeCityId\} \/>/);
  assert.match(panelSource, /OutskirtsPlanningOwner/);
});
