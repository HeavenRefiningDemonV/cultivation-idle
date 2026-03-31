import assert from 'node:assert/strict';
import test from 'node:test';

import { getRitualMotionProfile, getSelectionCommitDelay } from '../../src/ui/motion/ritualMotion.js';

test('reduced motion profile resolves to zero-duration interaction timings', () => {
  const profile = getRitualMotionProfile(true);
  assert.equal(profile.hoverMs, 0);
  assert.equal(profile.selectMs, 0);
  assert.equal(profile.modalMs, 0);
  assert.equal(profile.commitMs, 0);
});

test('default ritual profile stays within section-c calm timing envelope', () => {
  const profile = getRitualMotionProfile(false);
  assert.equal(profile.hoverMs >= 120 && profile.hoverMs <= 180, true);
  assert.equal(profile.selectMs >= 160 && profile.selectMs <= 220, true);
  assert.equal(profile.modalMs >= 180 && profile.modalMs <= 220, true);
  assert.equal(profile.commitMs <= 180, true);
  assert.equal(getSelectionCommitDelay(false), profile.commitMs);
});
