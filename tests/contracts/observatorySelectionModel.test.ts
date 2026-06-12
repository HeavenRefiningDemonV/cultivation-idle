import assert from 'node:assert/strict';
import test from 'node:test';

import {
  OBSERVATORY_FAMILY_OF_KIND,
  deriveObservatoryRelatedKeys,
  observatorySelectionKey,
  observatoryThreadKey,
} from '../../src/ui/status/observatory/observatorySelectionModel.js';
import type { StatusCausalThreadSurface } from '../../src/systems/ui/status/statusObservatoryTypes.js';

const statThread: StatusCausalThreadSurface = {
  id: 'stat-thread-weak',
  fromFamily: 'statConstellation',
  fromId: 'weak-stat',
  toFamily: 'bottleneckCanopy',
  toId: 'central-edict',
  label: 'Weak stat',
  detail: 'limits growth',
  tone: 'danger',
};

const causeThread: StatusCausalThreadSurface = {
  id: 'cause-thread-gate',
  fromFamily: 'meridianVessel',
  fromId: 'gate-readiness',
  toFamily: 'bottleneckCanopy',
  toId: 'central-edict',
  label: 'Gate readiness',
  detail: 'not secure',
  tone: 'warning',
};

const union = [statThread, causeThread];

test('null selection => no related keys', () => {
  assert.equal(deriveObservatoryRelatedKeys(null, union).size, 0);
});

test('work selection => no related keys (work has no threads)', () => {
  assert.equal(OBSERVATORY_FAMILY_OF_KIND.work, null);
  assert.equal(deriveObservatoryRelatedKeys({ kind: 'work', id: 'anything' }, union).size, 0);
});

test('selecting a weak-link stat relates its thread + both endpoints, not the unrelated cause', () => {
  const keys = deriveObservatoryRelatedKeys({ kind: 'stat', id: 'weak-stat' }, union);
  assert.ok(keys.has(observatorySelectionKey('statConstellation', 'weak-stat')));
  assert.ok(keys.has(observatorySelectionKey('bottleneckCanopy', 'central-edict')));
  assert.ok(keys.has(observatoryThreadKey('stat-thread-weak')));
  assert.ok(!keys.has(observatoryThreadKey('cause-thread-gate')));
});

test('bottleneck-anchor: a canopy selection relates ALL converging threads', () => {
  const keys = deriveObservatoryRelatedKeys({ kind: 'talisman', id: 'central-edict' }, union);
  assert.ok(keys.has(observatoryThreadKey('stat-thread-weak')));
  assert.ok(keys.has(observatoryThreadKey('cause-thread-gate')));
  assert.ok(keys.has(observatorySelectionKey('statConstellation', 'weak-stat')));
  assert.ok(keys.has(observatorySelectionKey('meridianVessel', 'gate-readiness')));
});
