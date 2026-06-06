import assert from 'node:assert/strict';
import test from 'node:test';

import { resolveLifeIdentityStatus } from '../../src/systems/lifeStart/lifeIdentity.js';

test('life identity predicate requires path, Heart Law, and breath before mechanical progress', () => {
  assert.deepEqual(resolveLifeIdentityStatus({
    pathId: null,
    selectedHeartLawId: null,
    breathMode: null,
  }), {
    complete: false,
    missing: ['path', 'heartLaw', 'breath'],
  });

  assert.deepEqual(resolveLifeIdentityStatus({
    pathId: 'heaven',
    selectedHeartLawId: null,
    breathMode: null,
  }), {
    complete: false,
    missing: ['heartLaw', 'breath'],
  });

  assert.deepEqual(resolveLifeIdentityStatus({
    pathId: 'heaven',
    selectedHeartLawId: 'heartlaw_quiet_breath',
    breathMode: null,
  }), {
    complete: false,
    missing: ['breath'],
  });

  assert.deepEqual(resolveLifeIdentityStatus({
    pathId: 'heaven',
    selectedHeartLawId: 'heartlaw_quiet_breath',
    breathMode: 'balanced',
  }), {
    complete: true,
    missing: [],
  });
});
