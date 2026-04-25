import assert from 'node:assert/strict';
import test from 'node:test';

import { buildOutskirtsMockupSurface } from '../../src/features/world/outskirts/buildOutskirtsMockupSurface.js';
import { createOutskirtsMockupFixture } from '../../src/features/world/outskirts/fixtures/createOutskirtsMockupFixture.js';

void test('outskirts inner palace preview surface remains present and compact in rewards card fixture', () => {
  const surface = buildOutskirtsMockupSurface(createOutskirtsMockupFixture());
  const preview = surface.rewardsCard.innerPalacePreview;

  assert.ok(preview);
  assert.equal(preview.visible, true);
  assert.equal(preview.slots.length, 8);
  assert.equal(preview.title, 'Inner Palace');
  assert.equal(preview.subtitle, 'Equipped Techniques');
  assert.equal(preview.footerLine.includes(preview.loadoutName), true);

  assert.equal(preview.slots.some((slot) => slot.slotType === 'active'), true);
  assert.equal(preview.slots.some((slot) => slot.slotType === 'passive'), true);
  assert.equal(preview.slots.some((slot) => slot.slotType === 'ultimate'), true);

  assert.equal(typeof surface.rewardsCard.goldHeadline.value, 'string');
  assert.equal(Array.isArray(surface.rewardsCard.commonMaterials.items), true);
  assert.equal(typeof surface.rewardsCard.trackedBounty.progressLabel, 'string');
  assert.equal(typeof surface.rewardsCard.estimatedEfficiency.runTimeLabel, 'string');
  assert.equal(typeof surface.rewardsCard.autoRepeat.value, 'string');
});
