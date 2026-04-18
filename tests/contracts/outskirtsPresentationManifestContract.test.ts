import assert from 'node:assert/strict';
import test from 'node:test';

import { OUTSKIRTS_ENCOUNTER_PROGRESS_STRIP_MANIFEST } from '../../src/features/world/outskirts/outskirtsMockupPresentation.js';
import { buildOutskirtsMockupSurface } from '../../src/features/world/outskirts/buildOutskirtsMockupSurface.js';
import { createOutskirtsMockupFixture } from '../../src/features/world/outskirts/fixtures/createOutskirtsMockupFixture.js';

void test('P10 presentation manifest keeps locked Pinewind ordering and display-level/scenic binding completeness', () => {
  const expectedOrder = ['quiet-glade', 'rockjaw-boar', 'snarling-wolf', 'venomcoil', 'shade-stalker', 'mire-serpent'];
  assert.deepEqual(OUTSKIRTS_ENCOUNTER_PROGRESS_STRIP_MANIFEST.map((entry) => entry.id), expectedOrder);
  assert.equal(OUTSKIRTS_ENCOUNTER_PROGRESS_STRIP_MANIFEST.every((entry) => entry.displayLevelText?.startsWith('Lv. ')), true);
  assert.equal(OUTSKIRTS_ENCOUNTER_PROGRESS_STRIP_MANIFEST.every((entry) => entry.artKey.startsWith('outskirts/encounter/')), true);
  assert.equal(OUTSKIRTS_ENCOUNTER_PROGRESS_STRIP_MANIFEST.every((entry) => entry.silhouetteKey.startsWith('outskirts/silhouette/')), true);
});

void test('P10 exact surface stays internally consistent with manifest ordering and selected encounter', () => {
  const surface = buildOutskirtsMockupSurface(createOutskirtsMockupFixture({ selectedEncounterId: 'snarling-wolf' }));
  const manifestIds = OUTSKIRTS_ENCOUNTER_PROGRESS_STRIP_MANIFEST.map((entry) => entry.id);
  const stripIds = surface.encounterProgressStrip.nodes.map((entry) => entry.id);
  assert.deepEqual(stripIds, manifestIds);
  assert.equal(surface.encounterProgressStrip.nodes.some((entry) => entry.id === surface.encounterHero.selectedEncounterId), true);
  assert.equal(surface.encounterProgressStrip.nodes.filter((entry) => entry.state === 'current').length, 1);
});
