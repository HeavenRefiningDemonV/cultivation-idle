import assert from 'node:assert/strict';
import test from 'node:test';

import { GameEvents } from '../../src/services/events/GameEvents.js';
import { createBalanceTelemetryHarness } from '../helpers/telemetry/createBalanceTelemetryHarness.js';

test('MP5 telemetry runtime hooks capture Training, Dao Heart, prestige memory, and reset buckets', () => {
  const harness = createBalanceTelemetryHarness();
  const now = Date.now();

  GameEvents.emit({
    type: 'training/started',
    payload: { timestamp: now, path: 'heaven', regimenId: 'still_star_breathing', intensity: 'steady', realmId: 'qi_condensation', ratingSnapshot: { qi_control: 4 }, fatigue: 12 },
  });
  GameEvents.emit({
    type: 'training/grade_changed',
    payload: { timestamp: now, statId: 'qi_control', oldGrade: 4, newGrade: 5, minutesSinceLastGrade: 12, realmId: 'qi_condensation' },
  });
  GameEvents.emit({
    type: 'dao_heart/started',
    payload: { timestamp: now, lawId: 'heartlaw_flame', activityId: 'verse_recitation', parityDelta: 0, turbulence: 4, clarity: 62 },
  });
  GameEvents.emit({
    type: 'prestige/memory_applied',
    payload: { timestamp: now, effectId: 'form_memory', rank: 2, value: 8, targetId: 'qi_control' },
  });
  GameEvents.emit({
    type: 'prestige/reset_bucket_applied',
    payload: { timestamp: now, bucketId: 'training_raw_ratings', kind: 'reset', label: 'Training raw ratings' },
  });

  const kinds = new Set(harness.balanceEvents.map((event) => event.kind));
  assert.equal(kinds.has('training/started'), true);
  assert.equal(kinds.has('training/grade_changed'), true);
  assert.equal(kinds.has('dao_heart/started'), true);
  assert.equal(kinds.has('prestige/memory_applied'), true);
  assert.equal(kinds.has('prestige/reset_bucket_applied'), true);
});
