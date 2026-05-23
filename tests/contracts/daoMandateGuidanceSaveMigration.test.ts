import assert from 'node:assert/strict';
import test from 'node:test';

import { buildDefaultSaveState, mergeWithDefaults } from '../../src/save/defaultSaveState.js';
import { useUIStore } from '../../src/stores/uiStore.js';

test('default saves serialize Dao Mandate guidance settings', () => {
  useUIStore.getState().setSettings({
    guidanceOath: 'jade',
    jadeSlipLessons: 'repeat_until_learned',
    localLensBanners: 'full',
    sourceRouteDetail: 'always',
    advancedReadinessMath: 'expanded',
    failureCoaching: 'full_reflection',
    backgroundReminders: 'full_optimization',
    recentOmensFeed: 'full',
    mandateMotionMode: 'low',
  });

  const save = buildDefaultSaveState();

  assert.deepEqual(save.uiSettings, {
    storyMotionMode: 'full',
    guidanceOath: 'elder',
    jadeSlipLessons: 'repeat_until_learned',
    localLensBanners: 'full',
    sourceRouteDetail: 'always',
    advancedReadinessMath: 'expanded',
    failureCoaching: 'full_reflection',
    backgroundReminders: 'full_optimization',
    recentOmensFeed: 'full',
    mandateMotionMode: 'low',
    daoMandateLessonMemory: { byConceptId: {} },
  });
});

test('old saves without uiSettings receive standard sparse compatibility defaults', () => {
  const merged = mergeWithDefaults({});

  assert.equal(merged.uiSettings?.storyMotionMode, 'full');
  assert.equal(merged.uiSettings?.guidanceOath, 'elder');
  assert.equal(merged.uiSettings?.jadeSlipLessons, 'first_time');
  assert.equal(merged.uiSettings?.sourceRouteDetail, 'needed_only');
  assert.equal(merged.uiSettings?.mandateMotionMode, 'follow_story');
});

test('old saves with only storyMotionMode preserve it and receive guidance defaults', () => {
  const merged = mergeWithDefaults({
    uiSettings: {
      storyMotionMode: 'reduced',
    },
  });

  assert.equal(merged.uiSettings?.storyMotionMode, 'reduced');
  assert.equal(merged.uiSettings?.guidanceOath, 'elder');
  assert.equal(merged.uiSettings?.sourceRouteDetail, 'needed_only');
  assert.equal(merged.uiSettings?.mandateMotionMode, 'follow_story');
});

test('malformed guidance save fields default individually without wiping valid settings', () => {
  const merged = mergeWithDefaults({
    uiSettings: {
      storyMotionMode: 'reduced',
      guidanceOath: 'maximum',
      sourceRouteDetail: 'always',
      localLensBanners: 'full',
      recentOmensFeed: 99,
    },
  });

  assert.equal(merged.uiSettings?.storyMotionMode, 'reduced');
  assert.equal(merged.uiSettings?.guidanceOath, 'elder');
  assert.equal(merged.uiSettings?.sourceRouteDetail, 'always');
  assert.equal(merged.uiSettings?.localLensBanners, 'full');
  assert.equal(merged.uiSettings?.recentOmensFeed, 'compact');
});

test('legacy Guidance Oath save values normalize while preserving valid granular controls', () => {
  for (const guidanceOath of ['sealed', 'elder', 'jade'] as const) {
    const merged = mergeWithDefaults({
      uiSettings: {
        guidanceOath,
        jadeSlipLessons: 'off',
        localLensBanners: 'full',
        sourceRouteDetail: 'always',
        advancedReadinessMath: 'expanded',
        failureCoaching: 'critical_only',
        backgroundReminders: 'full_optimization',
        recentOmensFeed: 'full',
        mandateMotionMode: 'reduced',
      },
    });

    assert.equal(merged.uiSettings?.guidanceOath, 'elder');
    assert.equal(merged.uiSettings?.jadeSlipLessons, 'off');
    assert.equal(merged.uiSettings?.localLensBanners, 'full');
    assert.equal(merged.uiSettings?.sourceRouteDetail, 'always');
    assert.equal(merged.uiSettings?.advancedReadinessMath, 'expanded');
    assert.equal(merged.uiSettings?.failureCoaching, 'critical_only');
    assert.equal(merged.uiSettings?.backgroundReminders, 'full_optimization');
    assert.equal(merged.uiSettings?.recentOmensFeed, 'full');
    assert.equal(merged.uiSettings?.mandateMotionMode, 'reduced');
  }
});
