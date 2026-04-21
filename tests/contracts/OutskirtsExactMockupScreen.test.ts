import assert from 'node:assert/strict';
import test from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { readFile } from 'node:fs/promises';

import { OutskirtsExactMockupScreen } from '../../src/features/world/outskirts/OutskirtsExactMockupScreen.js';
import { OutskirtsScenicStage } from '../../src/features/world/outskirts/components/OutskirtsScenicStage.js';
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

void test('P6 scenic center structure renders one scenic stage + one identity row with no visible fallback text', () => {
  const fixture = createOutskirtsMockupFixture({
    encounterDescriptor: 'DO_NOT_RENDER_DESCRIPTOR',
  });
  const surface = buildOutskirtsMockupSurface(fixture);
  const html = renderToStaticMarkup(React.createElement(OutskirtsExactMockupScreen, { surface }));

  assert.equal((html.match(/outskirts-exact-scenic-stage/g) ?? []).length, 1);
  assert.equal((html.match(/outskirts-exact-encounter-identity-row/g) ?? []).length, 1);
  assert.equal((html.match(/outskirts-exact-scenic-image/g) ?? []).length, 1);
  assert.equal(html.includes('outskirts-exact-scenic-fallback'), false);
  assert.equal(html.includes('DO_NOT_RENDER_DESCRIPTOR'), false);
  assert.equal(html.includes('scenic field'), false);
});

void test('P6 review fixture scenic/identity row remains target-locked and has no Watch button', () => {
  const surface = buildOutskirtsMockupSurface(createOutskirtsMockupFixture());
  const html = renderToStaticMarkup(React.createElement(OutskirtsExactMockupScreen, { surface }));

  assert.equal(html.includes('Snarling Wolf'), true);
  assert.equal(html.includes('Lv. 11'), true);
  assert.equal(html.includes('Safe'), true);
  assert.equal(html.includes('>Watch<'), false);
  assert.equal(html.includes('/assets/mockups/ChatGPT Image Apr 17, 2026, 04_24_04 PM.png'), true);
});

void test('P6 scenic placeholder suppression still renders stable slot when scenic src is absent', () => {
  const html = renderToStaticMarkup(React.createElement(OutskirtsScenicStage, {
    scenic: {
      scenicBackgroundKey: 'placeholder/scenic/outskirts-wolf-field',
      scenicImageSrc: null,
      reviewFixtureImageSrc: '/assets/mockups/ChatGPT Image Apr 17, 2026, 04_24_04 PM.png',
      liveFallbackImageSrc: '/assets/background/citystates/city_outskirts.png',
      useApprovedMockupCrop: false,
      maskVariant: 'wolf-hunt-lane',
      encounterArtKey: 'placeholder/encounter/snarling-wolf',
      environmentDescriptor: 'SHOULD_NOT_BE_VISIBLE',
    },
    identity: {
      selectedEncounterId: 'snarling-wolf',
      displayName: 'Snarling Wolf',
      levelLabel: 'Lv. 11',
      safetyChip: { state: 'safe', label: 'Safe' },
    },
  }));

  assert.equal(html.includes('outskirts-exact-scenic-stage'), true);
  assert.equal(html.includes('outskirts-exact-scenic-image'), true);
  assert.equal(html.includes('/assets/background/citystates/city_outskirts.png'), true);
  assert.equal(html.includes('SHOULD_NOT_BE_VISIBLE'), false);
  assert.equal(html.includes('outskirts-exact-scenic-fallback'), false);
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

void test('P6 no-scope-widening smoke: cards/strip/cta/summary remain present without P7+ rebuild assertions', () => {
  const surface = buildOutskirtsMockupSurface(createOutskirtsMockupFixture());
  const html = renderToStaticMarkup(React.createElement(OutskirtsExactMockupScreen, { surface }));

  assert.equal(html.includes('outskirtsSetupCard'), true);
  assert.equal(html.includes('outskirtsRewardsCard'), true);
  assert.equal(html.includes('outskirtsEncounterProgressStrip'), true);
  assert.equal(html.includes('outskirtsStartHuntCta'), true);
  assert.equal(html.includes('outskirtsGrindSummaryCard'), true);
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
