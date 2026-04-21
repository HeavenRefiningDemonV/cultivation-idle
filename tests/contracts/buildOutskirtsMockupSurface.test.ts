import assert from 'node:assert/strict';
import test from 'node:test';

import { buildOutskirtsMockupSurface } from '../../src/features/world/outskirts/buildOutskirtsMockupSurface.js';
import { createOutskirtsMockupFixture } from '../../src/features/world/outskirts/fixtures/createOutskirtsMockupFixture.js';

void test('buildOutskirtsMockupSurface emits v2 shape with explicit shell contract', () => {
  const surface = buildOutskirtsMockupSurface(createOutskirtsMockupFixture());

  assert.equal(surface.meta.version, 'p3.v2');
  assert.equal(surface.meta.mode, 'fixture');
  assert.equal(surface.page.title, 'Outskirts');
  assert.equal(surface.topRibbon.nodes.length, 6);
  assert.equal(surface.tacticalStrip.cells.length, 7);
  assert.equal(surface.areaHeader.subtitle, 'Gold and common materials');
  assert.equal(surface.scenicStage.useApprovedMockupCrop, true);
  assert.equal(surface.scenicStage.reviewFixtureImageSrc, '/assets/mockups/ChatGPT Image Apr 17, 2026, 04_24_04 PM.png');
  assert.equal(surface.rewardsCard.goldHeadline.value, '1,250 – 1,480');
  assert.deepEqual(surface.rewardsCard.commonMaterials.items.map((item) => item.label), ['Wolf Pelt', 'Beast Bone', 'Green Herb', 'Spirit Stone']);
  assert.equal(surface.encounterIdentity.selectedEncounterId, 'snarling-wolf');
  assert.deepEqual(surface.encounterStrip.nodes.map((node) => node.levelLabel), ['Lv. 8', 'Lv. 9', 'Lv. 11', 'Lv. 13', 'Lv. 15', 'Lv. 17']);
  assert.equal(surface.primaryAction.label, 'Start Hunt');
  assert.equal(surface.grindSummary.runsText, '128');
  assert.equal(surface.shell.singleDominantCta, true);
  assert.equal(surface.shell.showRunCompass, false);

  assert.equal('header' in surface, false);
  assert.equal('encounterChain' in surface, false);
  assert.equal('actionZone' in surface, false);
});

void test('buildOutskirtsMockupSurface preserves v2 structure for live-like values', () => {
  const surface = buildOutskirtsMockupSurface(createOutskirtsMockupFixture({
    sourceMode: 'stores',
    selectedEncounterId: 'venomcoil',
    selectedEncounterName: 'Venomcoil',
    selectedEncounterLevelLabel: 'Lv. 13',
    bountyLabel: null,
  }));

  assert.equal(surface.meta.mode, 'live');
  assert.equal(surface.encounterStrip.nodes.length, 6);
  assert.equal(surface.encounterStrip.selectedEncounterId, 'venomcoil');
  assert.equal(surface.scenicStage.useApprovedMockupCrop, false);
  assert.equal(surface.scenicStage.liveFallbackImageSrc, '/assets/background/citystates/city_outskirts.png');
  assert.equal(surface.setupCard.equipmentGrid.length, 6);
  assert.equal(surface.setupCard.equipmentGrid[2]?.label, 'Ring');
  assert.equal(surface.rewardsCard.estimatedEfficiency.title, 'Estimated Efficiency');
  assert.equal(surface.debug.missingDataFallbacks.includes('bountyLabel'), true);
});
