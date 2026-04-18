import assert from 'node:assert/strict';
import test from 'node:test';

import { buildOutskirtsMockupSurface } from '../../src/features/world/outskirts/buildOutskirtsMockupSurface.js';
import { createOutskirtsMockupFixture } from '../../src/features/world/outskirts/fixtures/createOutskirtsMockupFixture.js';

void test('buildOutskirtsMockupSurface returns fully populated stable contract object', () => {
  const surface = buildOutskirtsMockupSurface(createOutskirtsMockupFixture());

  assert.equal(surface.meta.surfaceId, 'outskirts-exact-mockup');
  assert.equal(surface.meta.exactMockup, true);
  assert.equal(surface.header.pageTitle.length > 0, true);
  assert.equal(surface.topProgress.nodes.length >= 1, true);
  assert.equal(surface.tacticalStrip.cells.length, 7);
  assert.equal(surface.setupCard.offense.length, 3);
  assert.equal(surface.setupCard.defense.length, 3);
  assert.equal(surface.setupCard.equipmentGrid.length, 6);
  assert.equal(surface.rewardsCard.noPrimaryCta, true);
  assert.equal(surface.encounterChain.nodes.length >= 1, true);
  assert.equal(typeof surface.encounterHero.scenicImageSrc === 'string', true);
  assert.equal(surface.actionZone.singleDominantCta, true);
  assert.equal(surface.shell.singleDominantCta, true);
  assert.equal(surface.shell.showRunCompass, false);
  assert.equal(surface.shell.showCombatModuleTopLane, false);
  assert.equal(surface.shell.showCombatTheater, false);
  assert.equal(surface.shell.showCombatHpBars, false);
  assert.equal(surface.shell.showCombatOptions, false);

  assert.deepEqual(surface.setupCard.offense.map((row) => row.label), ['ATK', 'ACC', 'CRIT']);
  assert.deepEqual(surface.setupCard.defense.map((row) => row.label), ['HP', 'EVA', 'RES']);
});

void test('buildOutskirtsMockupSurface fallback handling is deterministic', () => {
  const surface = buildOutskirtsMockupSurface(createOutskirtsMockupFixture({
    medicinePouchLabel: null,
    bountyLabel: null,
    scenicArtKey: 'placeholder/encounter/fallback',
    scenicBackgroundKey: 'placeholder/scenic/fallback',
  }));

  assert.match(surface.setupCard.medicinePouch.value, /No medicine pouch configured/i);
  assert.match(surface.tacticalStrip.cells[5].value, /No tracked bounty selected/i);
  assert.equal(surface.debug?.placeholderAssetKeysInUse.includes('placeholder/encounter/fallback'), true);
  assert.equal(surface.debug?.placeholderAssetKeysInUse.includes('placeholder/scenic/fallback'), true);
  assert.equal(surface.debug?.missingDataFallbacks.includes('medicinePouchLabel'), true);
  assert.equal(surface.debug?.missingDataFallbacks.includes('bountyLabel'), true);
  assert.equal(surface.encounterHero.scenicImageSrc === null, false);

  const defenseValues = surface.setupCard.defense.map((row) => row.value);
  assert.equal(defenseValues.length, 3);
});
