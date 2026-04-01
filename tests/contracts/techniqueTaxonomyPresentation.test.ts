import assert from 'node:assert/strict';
import test from 'node:test';

import {
  buildTechniqueTaxonomyPresentation,
  getPathAlignmentStrengthLabel,
  getTechniqueFamilyLabel,
  getTechniqueSupportFlagLabel,
} from '../../src/systems/builds/index.js';

test('taxonomy presentation exposes canonical labels', () => {
  assert.equal(getTechniqueFamilyLabel('coreDamage'), 'Core Damage');
  assert.equal(getTechniqueSupportFlagLabel('survival'), 'Survival');
  assert.equal(getPathAlignmentStrengthLabel('strong'), 'Path-Aligned');
  assert.equal(getPathAlignmentStrengthLabel('neutral'), 'Flex Support');
  assert.equal(getPathAlignmentStrengthLabel('off'), 'Off-Path');
});

test('presentation helper maps profile fields without UI decoding internals', () => {
  const surface = buildTechniqueTaxonomyPresentation({
    profile: {
      techId: 'missing_tech',
      families: ['guard', 'cleanse'],
      supportFlags: ['survival'],
    },
    selectedPath: 'earth',
  });

  assert.deepEqual(surface.familyLabels, ['Guard', 'Cleanse']);
  assert.deepEqual(surface.supportFlagLabels, ['Survival']);
  assert.equal(surface.selectedPathFit, 'off');
  assert.equal(surface.selectedPathFitLabel, 'Off-Path');
});
