import assert from 'node:assert/strict';
import test from 'node:test';

import {
  LIFE_START_WIZARD_STEPS,
  getLifeStartWizardCommittedStep,
  isLifeStartWizardRequired,
  resolveLifeStartWizardUiStep,
} from '../../src/systems/ui/lifeStart/lifeStartWizardContract.js';

test('committed state with no path and no heart law requires wizard at step 1', () => {
  assert.equal(isLifeStartWizardRequired({ selectedPath: null, selectedHeartLawId: null }), true);
  assert.equal(getLifeStartWizardCommittedStep({ selectedPath: null, selectedHeartLawId: null }), 1);
});

test('committed state with path chosen and no heart law requires wizard at step 2', () => {
  assert.equal(isLifeStartWizardRequired({ selectedPath: 'heaven', selectedHeartLawId: null }), true);
  assert.equal(getLifeStartWizardCommittedStep({ selectedPath: 'heaven', selectedHeartLawId: null }), 2);
});

test('ui state resolves to step 3 when path exists, no committed law, and draft law exists', () => {
  assert.equal(resolveLifeStartWizardUiStep({
    selectedPath: 'earth',
    selectedHeartLawId: null,
    draftHeartLawId: 'law_earth_root',
    requestedStep: null,
  }), 3);
});

test('ui state reaches step 3 when path exists, committed law is absent, and draft law is selected', () => {
  const resolved = resolveLifeStartWizardUiStep({
    selectedPath: 'heaven',
    selectedHeartLawId: null,
    draftHeartLawId: 'law_heaven_root',
    requestedStep: 3,
  });

  assert.equal(resolved, 3);
});

test('ui state resolves to step 2 when path exists, no committed law, and no draft law exists', () => {
  assert.equal(resolveLifeStartWizardUiStep({
    selectedPath: 'martial',
    selectedHeartLawId: null,
    draftHeartLawId: null,
    requestedStep: null,
  }), 2);
});

test('wizard step registry and resolver never expose a step 4', () => {
  assert.deepEqual(LIFE_START_WIZARD_STEPS, [1, 2, 3]);

  const resolved = resolveLifeStartWizardUiStep({
    selectedPath: 'heaven',
    selectedHeartLawId: 'law_heaven',
    draftHeartLawId: null,
    requestedStep: null,
  });

  assert.equal(LIFE_START_WIZARD_STEPS.includes(resolved), true);
});

test('back and forward step requests stay inside [1,2,3] and preserve resolver truth', () => {
  const fromStep2 = resolveLifeStartWizardUiStep({
    selectedPath: 'earth',
    selectedHeartLawId: null,
    draftHeartLawId: 'law_earth_root',
    requestedStep: 2,
  });
  const toStep3 = resolveLifeStartWizardUiStep({
    selectedPath: 'earth',
    selectedHeartLawId: null,
    draftHeartLawId: 'law_earth_root',
    requestedStep: 3,
  });
  const committedBackTo2 = resolveLifeStartWizardUiStep({
    selectedPath: 'earth',
    selectedHeartLawId: 'law_earth_root',
    draftHeartLawId: 'law_earth_root',
    requestedStep: 2,
  });
  const committedForward = resolveLifeStartWizardUiStep({
    selectedPath: 'earth',
    selectedHeartLawId: 'law_earth_root',
    draftHeartLawId: 'law_earth_root',
    requestedStep: 3,
  });

  [fromStep2, toStep3, committedBackTo2, committedForward].forEach((step) => {
    assert.equal(LIFE_START_WIZARD_STEPS.includes(step), true);
  });
  assert.equal(fromStep2, 2);
  assert.equal(toStep3, 3);
  assert.equal(committedBackTo2, 2);
  assert.equal(committedForward, 3);
});

test('external ownership is false once path and committed heart law both exist', () => {
  assert.equal(isLifeStartWizardRequired({ selectedPath: 'earth', selectedHeartLawId: 'law_earth' }), false);
  assert.equal(getLifeStartWizardCommittedStep({ selectedPath: 'earth', selectedHeartLawId: 'law_earth' }), 3);
});
