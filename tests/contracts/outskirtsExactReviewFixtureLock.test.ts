import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import test from 'node:test';

import { createOutskirtsMockupFixture } from '../../src/features/world/outskirts/fixtures/createOutskirtsMockupFixture.js';
import { buildOutskirtsMockupSurface } from '../../src/features/world/outskirts/buildOutskirtsMockupSurface.js';
import {
  OUTSKIRTS_ENCOUNTER_PROGRESS_DEFAULT_ID,
  OUTSKIRTS_ENCOUNTER_PROGRESS_STRIP_MANIFEST,
} from '../../src/features/world/outskirts/outskirtsMockupPresentation.js';

void test('P0 exact review fixture locks approved target anchors', () => {
  const fixture = createOutskirtsMockupFixture();
  const surface = buildOutskirtsMockupSurface(fixture);

  assert.equal(fixture.selectedEncounterId, 'snarling-wolf');
  assert.equal(fixture.selectedEncounterName, 'Snarling Wolf');
  assert.equal(fixture.selectedEncounterLevelLabel, 'Lv. 11');
  assert.equal(fixture.loadoutLabel, 'Set 2');
  assert.equal(fixture.aiProfileLabel, 'Balanced');
  assert.equal(fixture.attackFocusLabel, 'Balanced');
  assert.equal(fixture.hpLabel, '2,860 / 3,120');
  assert.equal(fixture.medicinePouchLabel, '12 / 20');
  assert.equal(fixture.bountyLabel, 'Wolf Pelt 7/15');
  assert.equal(fixture.expeditionLabel, '2 Idle');

  assert.deepEqual(fixture.offenseRows.map((r) => r.value), ['318', '92%', '18%']);
  assert.deepEqual(fixture.defenseRows.map((r) => r.value), ['3,120', '84%', '76%']);

  assert.deepEqual(surface.encounterProgressStrip.nodes.map((n) => n.label), [
    'Quiet Glade',
    'Rockjaw Boar',
    'Snarling Wolf',
    'Venomcoil',
    'Shade Stalker',
    'Mire Serpent',
  ]);
  assert.deepEqual(surface.encounterProgressStrip.nodes.map((n) => n.displayLevelText), [
    'Lv. 8',
    'Lv. 9',
    'Lv. 11',
    'Lv. 13',
    'Lv. 15',
    'Lv. 17',
  ]);
  assert.deepEqual(surface.encounterProgressStrip.nodes.map((n) => n.state), [
    'completed',
    'completed',
    'current',
    'future',
    'future',
    'future',
  ]);
  assert.equal(surface.grindSummary.runsText, 'Runs: 128');
  assert.equal(surface.grindSummary.goldPerHourText, 'Gold / hr: 1,900');
  assert.equal(surface.grindSummary.mainDropLabel, 'Wolf Pelt');
  assert.equal(surface.grindSummary.areaFilterText, 'This Area');
});

void test('P0 encounter manifest immutable order/levels/default are locked for review fixture', () => {
  assert.equal(OUTSKIRTS_ENCOUNTER_PROGRESS_DEFAULT_ID, 'snarling-wolf');
  assert.deepEqual(OUTSKIRTS_ENCOUNTER_PROGRESS_STRIP_MANIFEST.map((entry) => entry.id), [
    'quiet-glade',
    'rockjaw-boar',
    'snarling-wolf',
    'venomcoil',
    'shade-stalker',
    'mire-serpent',
  ]);
  assert.deepEqual(OUTSKIRTS_ENCOUNTER_PROGRESS_STRIP_MANIFEST.map((entry) => entry.displayLevelText), [
    'Lv. 8',
    'Lv. 9',
    'Lv. 11',
    'Lv. 13',
    'Lv. 15',
    'Lv. 17',
  ]);
});

void test('P0 approved mockup binding is explicit (in-repo file if present, otherwise external authority path)', async () => {
  const bindingDoc = await fs.readFile('docs/release/qa/ui-cutover/outskirts-exact/mockup-binding.md', 'utf8');
  const inRepo = 'docs/release/qa/ui-cutover/outskirts-exact/approved-mockup/outskirts-approved-exact.png';
  const external = '/mnt/data/ChatGPT Image Apr 17, 2026, 04_24_04 PM.png';

  assert.match(bindingDoc, /Primary visual authority/i);
  assert.equal(bindingDoc.includes(inRepo), true);

  const filePresent = await fs.access(inRepo).then(() => true).catch(() => false);
  if (filePresent) {
    assert.match(bindingDoc, /in-repo/i);
  } else {
    assert.equal(bindingDoc.includes(external), true);
    assert.match(bindingDoc, /external-only/i);
  }
});
