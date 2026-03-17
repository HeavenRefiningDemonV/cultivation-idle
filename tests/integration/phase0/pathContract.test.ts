import assert from 'node:assert/strict';
import test from 'node:test';

import {
  createFreshLife,
  createPhase0Harness,
  getLifeStartPath,
  getMechanicalPath,
} from '../../helpers/phase0Harness.ts';
import { expectCurrentlyBrokenContract } from '../../helpers/expectedFailure.ts';

test('PHASE0 CONTRACT (expected broken): life-start path must be the mechanical path and must not diverge later', () => {
  createPhase0Harness();

  createFreshLife('heaven');
  assert.equal(getLifeStartPath(), 'heaven', 'Life-start entry should persist chosen path');

  expectCurrentlyBrokenContract(() => {
    assert.equal(
      getMechanicalPath(),
      'heaven',
      'Mechanical path should immediately match the life-start choice without requiring a second selection layer.',
    );
  }, 'path truth: lifePath must equal selectedPath after new-life selection');
});
