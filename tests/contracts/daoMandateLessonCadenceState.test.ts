import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

import {
  buildDaoMandateLessons,
  buildDaoMandateSurfaceFromRunCompassV2,
  createDefaultDaoMandateGuidanceSettings,
  createDefaultDaoMandateLessonMemory,
  sanitizeDaoMandateLessonMemory,
  type DaoMandateLessonMemory,
} from '../../src/systems/ui/daoMandate/index.js';
import { buildDefaultSaveState, mergeWithDefaults } from '../../src/save/defaultSaveState.js';
import { useUIStore } from '../../src/stores/uiStore.js';
import { makeRunCompassV2Fixture } from '../helpers/daoMandate/runCompassFixture.js';

test('Dao Mandate lesson memory sanitizes old and malformed save data', () => {
  assert.deepEqual(sanitizeDaoMandateLessonMemory(undefined), createDefaultDaoMandateLessonMemory());

  const sanitized = sanitizeDaoMandateLessonMemory({
    byConceptId: {
      'mandate.primary_route': {
        seenCount: 2.8,
        firstSeenAt: 10,
        lastSeenAt: 20,
        dismissedAt: 30,
        learnedAt: 40,
        lastTriggerHash: 'primary:gate:route',
      },
      'invalid.lesson': {
        seenCount: 99,
        firstSeenAt: 1,
        lastSeenAt: 2,
      },
      'gate.failure_diagnosis': {
        seenCount: -5,
        firstSeenAt: 'bad',
        lastSeenAt: Number.NaN,
        dismissedAt: 'bad',
        learnedAt: {},
        lastTriggerHash: 42,
      },
    },
  });

  assert.deepEqual(Object.keys(sanitized.byConceptId).sort(), [
    'gate.failure_diagnosis',
    'mandate.primary_route',
  ]);
  assert.equal(sanitized.byConceptId['mandate.primary_route']?.seenCount, 2);
  assert.equal(sanitized.byConceptId['mandate.primary_route']?.learnedAt, 40);
  assert.equal(sanitized.byConceptId['gate.failure_diagnosis']?.seenCount, 0);
  assert.equal(sanitized.byConceptId['gate.failure_diagnosis']?.lastTriggerHash, undefined);
});

test('Dao Mandate lesson memory persists through save defaults and migration merge', () => {
  useUIStore.getState().hardResetUI();
  useUIStore.getState().dismissDaoMandateLesson({
    conceptId: 'mandate.primary_route',
    triggerHash: 'primary:gate:route',
  });

  const save = buildDefaultSaveState();
  assert.equal(save.uiSettings?.daoMandateLessonMemory?.byConceptId['mandate.primary_route']?.dismissedAt !== undefined, true);

  const merged = mergeWithDefaults({
    uiSettings: {
      storyMotionMode: 'reduced',
      daoMandateLessonMemory: {
        byConceptId: {
          'mandate.primary_route': {
            seenCount: 1,
            firstSeenAt: 1,
            lastSeenAt: 1,
            dismissedAt: 2,
            lastTriggerHash: 'primary:gate:route',
          },
          bad: {
            seenCount: 1,
            firstSeenAt: 1,
            lastSeenAt: 1,
          },
        },
      },
    },
  });

  assert.equal(merged.uiSettings?.storyMotionMode, 'reduced');
  assert.equal(merged.uiSettings?.daoMandateLessonMemory?.byConceptId['mandate.primary_route']?.dismissedAt, 2);
  assert.equal('bad' in (merged.uiSettings?.daoMandateLessonMemory?.byConceptId ?? {}), false);
});

test('repeat-until-learned lessons suppress dismissed same trigger and learned concepts', () => {
  const surface = buildDaoMandateSurfaceFromRunCompassV2(makeRunCompassV2Fixture(), { guidanceProfile: 'jade' });
  const settings = {
    ...createDefaultDaoMandateGuidanceSettings(),
    guidanceOath: 'jade' as const,
    jadeSlipLessons: 'repeat_until_learned' as const,
  };
  const first = buildDaoMandateLessons({ surface, settings, memory: createDefaultDaoMandateLessonMemory() })[0];
  assert.ok(first);
  const firstConceptId = first.conceptId as keyof DaoMandateLessonMemory['byConceptId'];

  const dismissedSameTrigger: DaoMandateLessonMemory = {
    byConceptId: {
      [firstConceptId]: {
        seenCount: 1,
        firstSeenAt: 1,
        lastSeenAt: 1,
        dismissedAt: 2,
        lastTriggerHash: first.triggerHash,
      },
    },
  };
  assert.equal(
    buildDaoMandateLessons({ surface, settings, memory: dismissedSameTrigger })
      .some((slip) => slip.conceptId === first.conceptId),
    false,
  );

  const learned: DaoMandateLessonMemory = {
    byConceptId: {
      [firstConceptId]: {
        ...dismissedSameTrigger.byConceptId[firstConceptId],
        learnedAt: 3,
      },
    },
  };
  assert.equal(
    buildDaoMandateLessons({ surface, settings, memory: learned })
      .some((slip) => slip.conceptId === first.conceptId),
    false,
  );
});

test('Status Mandate Chamber wires Jade Slip dismiss and learned handlers', () => {
  const source = readFileSync('src/components/screens/StatusScreen.tsx', 'utf8');
  assert.match(source, /dismissDaoMandateLesson/);
  assert.match(source, /markDaoMandateLessonLearned/);
  assert.match(source, /onDismiss=\{handleJadeSlipDismiss\}/);
  assert.match(source, /onLearned=\{handleJadeSlipLearned\}/);
});
