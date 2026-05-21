import assert from 'node:assert/strict';
import test from 'node:test';

import {
  buildDaoMandateLessons,
  buildDaoMandateSurfaceFromRunCompassV2,
  createDefaultDaoMandateGuidanceSettings,
  type DaoMandateLessonMemory,
} from '../../src/systems/ui/daoMandate/index.js';
import { makeRunCompassV2Fixture } from '../helpers/daoMandate/runCompassFixture.js';

const emptyMemory: DaoMandateLessonMemory = { byConceptId: {} };

test('P7 Jade Slips obey off, first-time dismissal, and repeat-until-learned cadence', () => {
  const surface = buildDaoMandateSurfaceFromRunCompassV2(makeRunCompassV2Fixture(), { guidanceProfile: 'jade' });
  const defaults = createDefaultDaoMandateGuidanceSettings();

  assert.equal(buildDaoMandateLessons({
    surface,
    settings: { ...defaults, jadeSlipLessons: 'off' },
    memory: emptyMemory,
  }).length, 0);

  const firstTime = buildDaoMandateLessons({
    surface,
    settings: { ...defaults, guidanceOath: 'elder', jadeSlipLessons: 'first_time' },
    memory: emptyMemory,
  });
  assert.equal(firstTime.length, 1);
  assert.equal(firstTime[0].profile, 'all');
  assert.ok(firstTime[0].relatedRowId || firstTime[0].route);

  const dismissed: DaoMandateLessonMemory = {
    byConceptId: {
      [firstTime[0].conceptId as keyof DaoMandateLessonMemory['byConceptId']]: {
        seenCount: 1,
        firstSeenAt: 1,
        lastSeenAt: 1,
        dismissedAt: 2,
        lastTriggerHash: firstTime[0].triggerHash,
      },
    },
  };
  assert.equal(buildDaoMandateLessons({
    surface,
    settings: { ...defaults, guidanceOath: 'elder', jadeSlipLessons: 'first_time' },
    memory: dismissed,
  }).length, 0);

  const repeated = buildDaoMandateLessons({
    surface,
    settings: { ...defaults, guidanceOath: 'jade', jadeSlipLessons: 'repeat_until_learned' },
    memory: dismissed,
  });
  assert.equal(repeated.length > 0, true);

  const learned: DaoMandateLessonMemory = {
    byConceptId: {
      [firstTime[0].conceptId as keyof DaoMandateLessonMemory['byConceptId']]: {
        ...dismissed.byConceptId[firstTime[0].conceptId as keyof DaoMandateLessonMemory['byConceptId']],
        learnedAt: 3,
      },
    },
  };
  assert.equal(buildDaoMandateLessons({
    surface,
    settings: { ...defaults, guidanceOath: 'jade', jadeSlipLessons: 'repeat_until_learned' },
    memory: learned,
  }).some((slip) => slip.conceptId === firstTime[0].conceptId), false);
});

test('P7 Jade Slips stay contextual and avoid chore or collectible copy', () => {
  const surface = buildDaoMandateSurfaceFromRunCompassV2(makeRunCompassV2Fixture(), { guidanceProfile: 'jade' });
  const slips = buildDaoMandateLessons({
    surface,
    settings: { ...createDefaultDaoMandateGuidanceSettings(), guidanceOath: 'jade', jadeSlipLessons: 'repeat_until_learned' },
    memory: emptyMemory,
  });

  assert.equal(slips.length > 0 && slips.length <= 3, true);
  for (const slip of slips) {
    assert.ok(slip.id.startsWith('jade-slip:'));
    assert.ok(slip.conceptId.length > 0);
    assert.ok(slip.triggerHash.length > 0);
    assert.ok(slip.relatedRowId || slip.route);
    assert.doesNotMatch(`${slip.title} ${slip.detail}`, /daily|collect|collection|checklist|chore|Packet|P7|debug|placeholder/i);
  }
});
