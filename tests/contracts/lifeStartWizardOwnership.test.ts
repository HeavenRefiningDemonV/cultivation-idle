import assert from 'node:assert/strict';
import test from 'node:test';

import {
  getLifeStartWizardCommittedStep,
  isLifeStartWizardRequired,
  LIFE_START_WIZARD_STEPS,
  resolveLifeStartWizardUiStep,
} from '../../src/systems/ui/lifeStart/lifeStartWizardContract.js';

test('committed state without path or heart law requires wizard at step 1', () => {
  assert.equal(isLifeStartWizardRequired({ selectedPath: null, selectedHeartLawId: null }), true);
  assert.equal(getLifeStartWizardCommittedStep({ selectedPath: null, selectedHeartLawId: null }), 1);
});

test('committed state with path and without heart law requires wizard at step 2', () => {
  assert.equal(isLifeStartWizardRequired({ selectedPath: 'heaven', selectedHeartLawId: null }), true);
  assert.equal(getLifeStartWizardCommittedStep({ selectedPath: 'heaven', selectedHeartLawId: null }), 2);
});

test('ui state resolves to step 3 when path is committed and heart law is drafted', () => {
  assert.equal(
    resolveLifeStartWizardUiStep({
      selectedPath: 'earth',
      selectedHeartLawId: null,
      draftHeartLawId: 'law_a',
      requestedStep: 3,
    }),
    3,
  );
});

test('ui state resolves to step 2 when path is committed and heart law is not drafted', () => {
  assert.equal(
    resolveLifeStartWizardUiStep({
      selectedPath: 'martial',
      selectedHeartLawId: null,
      draftHeartLawId: null,
      requestedStep: 3,
    }),
    2,
  );
});

test('wizard step registry and ui resolver never surface step 4', () => {
  assert.deepEqual(LIFE_START_WIZARD_STEPS, [1, 2, 3]);
  assert.equal(
    resolveLifeStartWizardUiStep({
      selectedPath: 'heaven',
      selectedHeartLawId: null,
      draftHeartLawId: 'law_a',
      requestedStep: 2,
    }),
    2,
  );
});

test('ownership is false once committed path and committed heart law are present', () => {
  assert.equal(isLifeStartWizardRequired({ selectedPath: 'earth', selectedHeartLawId: 'law_a' }), false);
});
