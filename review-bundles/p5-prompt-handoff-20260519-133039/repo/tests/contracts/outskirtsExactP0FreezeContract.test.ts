import assert from 'node:assert/strict';
import test from 'node:test';

import { createOutskirtsMockupFixture } from '../../src/features/world/outskirts/fixtures/createOutskirtsMockupFixture.js';
import { buildOutskirtsMockupSurface } from '../../src/features/world/outskirts/buildOutskirtsMockupSurface.js';

void test('outskirts freeze contract locks approved realistic review fixture values', () => {
  const fixture = createOutskirtsMockupFixture();
  const surface = buildOutskirtsMockupSurface(fixture);

  assert.equal(surface.page.title, 'Outskirts');
  assert.equal(surface.areaHeader.plaqueLabel, 'Outskirts');
  assert.equal(surface.areaHeader.subtitle, 'Gold and common materials');
  assert.equal(surface.encounterIdentity.selectedEncounterId, 'snarling-wolf');
  assert.equal(surface.encounterIdentity.displayName, 'Snarling Wolf');
  assert.equal(surface.encounterIdentity.levelLabel, 'Lv. 11');
  assert.equal(surface.encounterIdentity.safetyChip.label, 'Safe');

  assert.deepEqual(surface.encounterStrip.nodes.map((n) => `${n.label} ${n.levelLabel}`), [
    'Quiet Glade Lv. 8',
    'Rockjaw Boar Lv. 9',
    'Snarling Wolf Lv. 11',
    'Venomcoil Lv. 13',
    'Shade Stalker Lv. 15',
    'Mire Serpent Lv. 17',
  ]);
  assert.deepEqual(surface.encounterStrip.nodes.map((n) => n.state), ['completed', 'completed', 'current', 'future', 'future', 'future']);

  assert.equal(surface.setupCard.loadoutRow.value, 'Set 2');
  assert.equal(surface.setupCard.attackFocusRow.value, 'Balanced');
  assert.equal(surface.rewardsCard.trackedBounty.itemLabel, 'Wolf Pelt');
  assert.equal(surface.rewardsCard.autoRepeat.value, 'On');
  assert.equal(surface.grindSummary.scopeChipLabel, 'This Area');
  assert.equal(surface.grindSummary.runsText, '128');
  assert.equal(surface.grindSummary.goldPerHourText, '1,900');
  assert.equal(surface.grindSummary.mainDropLabel, 'Wolf Pelt');
});
