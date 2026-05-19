import assert from 'node:assert/strict';
import test from 'node:test';

import {
  OUTSKIRTS_ENCOUNTER_DEFAULT_ID,
  OUTSKIRTS_ENCOUNTER_STRIP_MANIFEST,
  OUTSKIRTS_TACTICAL_CELL_ORDER,
} from '../../src/features/world/outskirts/outskirtsMockupPresentation.js';

void test('outskirts presentation manifest locks encounter default/order/levels and tactical order', () => {
  assert.equal(OUTSKIRTS_ENCOUNTER_DEFAULT_ID, 'snarling-wolf');
  assert.deepEqual(OUTSKIRTS_ENCOUNTER_STRIP_MANIFEST.map((entry) => entry.id), [
    'quiet-glade',
    'rockjaw-boar',
    'snarling-wolf',
    'venomcoil',
    'shade-stalker',
    'mire-serpent',
  ]);
  assert.deepEqual(OUTSKIRTS_ENCOUNTER_STRIP_MANIFEST.map((entry) => entry.levelLabel), [
    'Lv. 8',
    'Lv. 9',
    'Lv. 11',
    'Lv. 13',
    'Lv. 15',
    'Lv. 17',
  ]);
  assert.deepEqual(OUTSKIRTS_TACTICAL_CELL_ORDER, ['hp', 'danger', 'loadout', 'aiProfile', 'healing', 'bounty', 'expedition']);
});
