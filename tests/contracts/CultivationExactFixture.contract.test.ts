import assert from 'node:assert/strict';
import test from 'node:test';

import { createCultivationExactMockupFixture } from '../../src/features/cultivation/exact/buildCultivationExactSurface.js';

void test('Cultivation Exact fixture locks the Lotus Meditation Terrace default state', () => {
  const surface = createCultivationExactMockupFixture();

  assert.equal(surface.meta.surfaceId, 'cultivation-exact');
  assert.equal(surface.meta.version, 'lotus-meditation-terrace.v1');
  assert.equal(surface.meta.rootTestId, 'cultivation-exact-page');
  assert.equal(surface.meta.mode, 'fixture');
  assert.equal(surface.meta.activityState, 'cultivating');
  assert.equal(surface.meta.selectedDrawer, 'none');

  assert.deepEqual(
    surface.topRibbon.map((cell) => [cell.label, cell.primary, cell.secondary ?? null]),
    [
      ['Realm', 'Qi Condensation', 'Stage 7'],
      ['Qi', '5.5M', null],
      ['Cultivation Rate', '292.25 / s', null],
      ['Stability', '0%', null],
      ['Foreground', 'Cultivating', null],
    ],
  );
  assert.equal(surface.topRibbon.length, 5);

  assert.deepEqual(
    surface.leftMilestoneSeals.map((seal) => [seal.eyebrow, seal.title, seal.value ?? null]),
    [
      ['Next Milestone', 'Push Qi', null],
      ['Need', 'Qi Cap', '24.4M'],
      ['Action', 'Continue Cultivation', null],
    ],
  );
  assert.equal(surface.leftMilestoneSeals.length, 3);

  assert.deepEqual(
    surface.rightDoctrineSeals.map((seal) => [seal.label, seal.value, seal.subvalue ?? null]),
    [
      ['Path', 'Heaven', null],
      ['Spirit Root', 'Fire / Rare', null],
      ['Heart Law', 'Ember Thread Sutra', null],
      ['Verse', 'Chapter 1', null],
      ['Breath / Focus', 'Balanced', null],
    ],
  );
  assert.equal(surface.rightDoctrineSeals.length, 5);

  assert.equal(surface.qiRail.combinedLabel, 'Qi 5.5M / 24.4M');
  assert.equal(surface.qiRail.currentLabel, '5.5M');
  assert.equal(surface.qiRail.requiredLabel, '24.4M');
  assert.equal(surface.qiRail.displayPercent, 35);
  assert.equal(surface.commandDeck.primary.label, 'Stop Cultivation');
  assert.equal(surface.commandDeck.primary.disabled, false);
  assert.equal(surface.commandDeck.secondary?.label, 'Break Through');
  assert.equal(surface.commandDeck.secondary?.disabled, true);
  assert.equal(surface.commandDeck.secondary?.tone, 'quiet');
  assert.equal(surface.commandDeck.supportLine, 'Qi Cap 24.4M');
  assert.equal(surface.shell.preserveHeroArt, true);
  assert.equal(surface.shell.showLegacySidePanels, false);
  assert.equal(surface.shell.singleDominantQiBar, true);
  assert.equal(surface.shell.singlePrimaryAction, true);
  assert.equal(surface.shell.useMockupAsSingleBitmap, false);
  assert.equal(surface.centerAltar.visualFlags.usesExistingCbgFull, true);
  assert.equal(surface.centerAltar.visualFlags.replacesHeroArt, false);
  assert.equal(surface.centerAltar.visualFlags.coversCultivatorFace, false);
  assert.equal(surface.centerAltar.visualFlags.coversDantian, false);
});
