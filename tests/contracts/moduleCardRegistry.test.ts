import assert from 'node:assert/strict';
import test from 'node:test';

import {
  WORLD_MODULE_GROUP_ORDER,
  WORLD_ROUTING_CHIP_DEFINITIONS,
  getWorldModuleCardDefinitions,
} from '../../src/systems/world/moduleCardRegistry.js';

const expectedChipLabels = [
  'Recommended Now',
  'Useful Soon',
  'Claim Ready',
  'Idle Slot',
  'Build Fix',
  'Gate Critical',
  'Stock Low',
];

test('module card registry covers exactly live modules and excludes deferred modules', () => {
  const definitions = getWorldModuleCardDefinitions();
  const moduleKeys = definitions.map((entry) => entry.moduleKey);

  assert.equal(moduleKeys.length, 8);
  assert.deepEqual(moduleKeys.includes('outskirts'), true);
  assert.deepEqual(moduleKeys.includes('expeditions'), true);
  assert.equal(moduleKeys.includes('alchemy' as never), false);
  assert.equal(moduleKeys.includes('talismanStudio' as never), false);
  assert.deepEqual(moduleKeys, [
    'outskirts',
    'ruins',
    'gateTrial',
    'manualPavilion',
    'apothecary',
    'forge',
    'bounties',
    'expeditions',
  ]);
});

test('module card registry group order and chip vocabulary are stable', () => {
  assert.deepEqual([...WORLD_MODULE_GROUP_ORDER], ['combat', 'preparation', 'support']);
  assert.deepEqual(Object.values(WORLD_ROUTING_CHIP_DEFINITIONS).map((entry) => entry.label), expectedChipLabels);
});

test('bounties and manual pavilion metadata lock key player-facing output hints', () => {
  const definitions = getWorldModuleCardDefinitions();
  const bounties = definitions.find((entry) => entry.moduleKey === 'bounties');
  const manual = definitions.find((entry) => entry.moduleKey === 'manualPavilion');
  const gateTrial = definitions.find((entry) => entry.moduleKey === 'gateTrial');
  const apothecary = definitions.find((entry) => entry.moduleKey === 'apothecary');
  const expeditions = definitions.find((entry) => entry.moduleKey === 'expeditions');

  assert.ok(bounties);
  assert.ok(manual);
  assert.ok(gateTrial);
  assert.ok(apothecary);
  assert.ok(expeditions);
  assert.deepEqual(bounties?.defaultOutputs.map((entry) => entry.label), ['Merit', 'Spirit Stones']);
  assert.deepEqual(manual?.defaultOutputs.map((entry) => entry.label), ['Manuals', 'Technique Fragments']);
  assert.deepEqual(apothecary?.defaultOutputs.map((entry) => entry.label), ['Healing Stock', 'Preparation Remedies']);
  assert.equal(gateTrial?.roleTag, 'Gate Progress');
  assert.equal(bounties?.roleTag, 'Merit & Routing');
  assert.equal(expeditions?.roleTag, 'Passive Support');
});
