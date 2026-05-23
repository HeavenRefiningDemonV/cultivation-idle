import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

import {
  createDefaultDaoMandateGuidanceSettings,
  resolveDaoMandateEffectiveMotionMode,
  sanitizeDaoMandateGuidanceSettings,
} from '../../src/systems/ui/daoMandate/index.js';

test('Dao Mandate guidance defaults use Elder profile and documented granular values', () => {
  const defaults = createDefaultDaoMandateGuidanceSettings();

  assert.deepEqual(defaults, {
    guidanceOath: 'elder',
    jadeSlipLessons: 'first_time',
    localLensBanners: 'compact',
    sourceRouteDetail: 'needed_only',
    advancedReadinessMath: 'collapsed',
    failureCoaching: 'every_gate_loss',
    backgroundReminders: 'normal',
    recentOmensFeed: 'compact',
    mandateMotionMode: 'follow_story',
  });
});

test('Dao Mandate guidance settings no longer export public strategy option cards', () => {
  const indexSource = readFileSync('src/systems/ui/daoMandate/index.ts', 'utf8');
  const settingsSource = readFileSync('src/systems/ui/daoMandate/daoMandateGuidanceSettings.ts', 'utf8');

  assert.doesNotMatch(indexSource, /DAO_GUIDANCE_OATH_OPTIONS/);
  assert.doesNotMatch(settingsSource, /Sealed Counsel|Elder's Counsel|Jade Slip Tutor/);
  assert.doesNotMatch(settingsSource, /Low guidance|Default guidance|Maximum guidance/);
});

test('Dao Mandate guidance sanitizer defaults malformed inputs', () => {
  const defaults = createDefaultDaoMandateGuidanceSettings();

  assert.deepEqual(sanitizeDaoMandateGuidanceSettings(null), defaults);
  assert.deepEqual(sanitizeDaoMandateGuidanceSettings('elder'), defaults);
  assert.deepEqual(sanitizeDaoMandateGuidanceSettings([]), defaults);
});

test('Dao Mandate guidance sanitizer preserves valid fields and defaults invalid fields individually', () => {
  const settings = sanitizeDaoMandateGuidanceSettings({
    guidanceOath: 'jade',
    jadeSlipLessons: 'forever',
    localLensBanners: 'full',
    sourceRouteDetail: 123,
    advancedReadinessMath: 'expanded',
    failureCoaching: 'critical_only',
    backgroundReminders: 'full_optimization',
    recentOmensFeed: 99,
    mandateMotionMode: 'low',
  });

  assert.equal(settings.guidanceOath, 'elder');
  assert.equal(settings.jadeSlipLessons, 'first_time');
  assert.equal(settings.localLensBanners, 'full');
  assert.equal(settings.sourceRouteDetail, 'needed_only');
  assert.equal(settings.advancedReadinessMath, 'expanded');
  assert.equal(settings.failureCoaching, 'critical_only');
  assert.equal(settings.backgroundReminders, 'full_optimization');
  assert.equal(settings.recentOmensFeed, 'compact');
  assert.equal(settings.mandateMotionMode, 'low');
});

test('legacy Guidance Oath values normalize to the standard sparse compatibility profile', () => {
  for (const guidanceOath of ['sealed', 'elder', 'jade'] as const) {
    const settings = sanitizeDaoMandateGuidanceSettings({ guidanceOath });
    assert.equal(settings.guidanceOath, 'elder');
  }
});

test('Dao Mandate effective motion follows story motion unless overridden or reduced by preference', () => {
  assert.equal(
    resolveDaoMandateEffectiveMotionMode({
      mandateMotionMode: 'follow_story',
      storyMotionMode: 'full',
    }),
    'full',
  );
  assert.equal(
    resolveDaoMandateEffectiveMotionMode({
      mandateMotionMode: 'follow_story',
      storyMotionMode: 'reduced',
    }),
    'reduced',
  );
  assert.equal(
    resolveDaoMandateEffectiveMotionMode({
      mandateMotionMode: 'follow_story',
      storyMotionMode: 'off',
    }),
    'reduced',
  );
  assert.equal(
    resolveDaoMandateEffectiveMotionMode({
      mandateMotionMode: 'medium',
      storyMotionMode: 'off',
    }),
    'medium',
  );
  assert.equal(
    resolveDaoMandateEffectiveMotionMode({
      mandateMotionMode: 'full',
      storyMotionMode: 'full',
      prefersReducedMotion: true,
    }),
    'reduced',
  );
});
