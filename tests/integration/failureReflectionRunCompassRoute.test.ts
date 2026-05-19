import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

import type { FailureReflectionUpdatedEvent } from '../../src/services/events/GameEvents.js';
import { buildRunDeltaFromEvent } from '../../src/systems/runDeltas/buildRunDeltaFromEvent.js';

test('Inner Demon Reflection routes through Run Compass instead of a new command surface', () => {
  const source = readFileSync('src/systems/ui/runCompass/buildRunCompassSurfaceV2.ts', 'utf8');
  assert.equal(source.includes('useFailureReflectionStore'), true);
  assert.equal(source.includes('Inner Demon Reflection active'), true);
  assert.equal(source.includes('routeForFailureReflection'), true);
});

test('Inner Demon Reflection event becomes a bounded trial delta', () => {
  const event: FailureReflectionUpdatedEvent = {
    type: 'failure_reflection/updated',
    payload: {
      timestamp: 100,
      reflectionId: 'inner_demon:trial_novices_clearing:1:underprepared',
      trialId: 'trial_novices_clearing',
      gateIndex: 1,
      diagnosisCode: 'underprepared',
      repeatedCount: 2,
      resolved: false,
      correctiveRouteTarget: 'apothecary',
      correctiveRouteLabel: 'Apothecary Healing Prep',
    },
  };

  const built = buildRunDeltaFromEvent(event);
  assert.equal(built.kind, 'push');
  if (built.kind === 'push') {
    assert.equal(built.delta.source, 'trial');
    assert.match(built.delta.label, /Inner Demon/i);
    assert.match(built.delta.memoryLine, /underprepared/i);
    assert.equal(built.delta.routeDelta?.label, 'Apothecary Healing Prep');
  }
});
