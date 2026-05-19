import assert from 'node:assert/strict';
import test from 'node:test';

import {
  buildFailureReflectionSurface,
  clearFailureReflections,
  recordFailureReflectionAttempt,
  resolveFailureReflectionForTrial,
  useFailureReflectionStore,
} from '../../src/systems/failureReflection/index.js';

test.beforeEach(() => {
  clearFailureReflections();
});

test.afterEach(() => {
  clearFailureReflections();
});

test('two repeated same gate diagnoses create one active reflection with one corrective route', () => {
  const first = recordFailureReflectionAttempt({
    trialId: 'trial_novices_clearing',
    gateIndex: 1,
    diagnosisCode: 'underprepared',
    createdAt: 100,
    topFixDestination: 'apothecary',
    topFixReason: 'Stock Healing Floor before returning.',
  });
  const second = recordFailureReflectionAttempt({
    trialId: 'trial_novices_clearing',
    gateIndex: 1,
    diagnosisCode: 'underprepared',
    createdAt: 120,
    topFixDestination: 'apothecary',
    topFixReason: 'Stock Healing Floor before returning.',
  });

  assert.equal(first, null);
  assert.ok(second);
  assert.equal(useFailureReflectionStore.getState().reflections.length, 1);
  assert.equal(second.repeatedCount, 2);
  assert.equal(second.correctiveRoute.target, 'apothecary');

  const surface = buildFailureReflectionSurface(second);
  assert.equal(surface.version, 1);
  assert.match(surface.title, /Inner Demon/i);
  assert.match(surface.correctiveRouteLabel, /Apothecary|Healing/i);
  assert.doesNotMatch(JSON.stringify(surface), /Skill issue|too weak|failed again/i);
});

test('different diagnoses do not create a false repeated pattern', () => {
  recordFailureReflectionAttempt({
    trialId: 'trial_novices_clearing',
    gateIndex: 1,
    diagnosisCode: 'underprepared',
    createdAt: 100,
    topFixDestination: 'apothecary',
    topFixReason: 'Stock medicine.',
  });
  const reflection = recordFailureReflectionAttempt({
    trialId: 'trial_novices_clearing',
    gateIndex: 1,
    diagnosisCode: 'underforged',
    createdAt: 120,
    topFixDestination: 'forge',
    topFixReason: 'Raise weapon floor.',
  });

  assert.equal(reflection, null);
  assert.equal(useFailureReflectionStore.getState().reflections.length, 0);
});

test('active reflection lookup is scoped by gate index', () => {
  const gateOne = recordFailureReflectionAttempt({
    trialId: 'trial_novices_clearing',
    gateIndex: 1,
    diagnosisCode: 'underprepared',
    createdAt: 100,
    topFixDestination: 'apothecary',
    topFixReason: 'Stock medicine.',
    repeatedCountOverride: 2,
  });
  const gateTwo = recordFailureReflectionAttempt({
    trialId: 'trial_novices_clearing',
    gateIndex: 2,
    diagnosisCode: 'underforged',
    createdAt: 120,
    topFixDestination: 'forge',
    topFixReason: 'Raise weapon floor.',
    repeatedCountOverride: 2,
  });

  assert.ok(gateOne);
  assert.ok(gateTwo);
  assert.equal(useFailureReflectionStore.getState().getActiveReflectionForTrial('trial_novices_clearing', 1)?.reflectionId, gateOne.reflectionId);
  assert.equal(useFailureReflectionStore.getState().getActiveReflectionForTrial('trial_novices_clearing', 2)?.reflectionId, gateTwo.reflectionId);
});

test('gate clear resolves active reflection without granting rewards', () => {
  const reflection = recordFailureReflectionAttempt({
    trialId: 'trial_novices_clearing',
    gateIndex: 1,
    diagnosisCode: 'underforged',
    createdAt: 100,
    topFixDestination: 'forge',
    topFixReason: 'Raise weapon floor.',
    repeatedCountOverride: 2,
  });
  assert.ok(reflection);

  resolveFailureReflectionForTrial('trial_novices_clearing', 1, 'gate_cleared', 150);

  const resolved = useFailureReflectionStore.getState().reflections[0];
  assert.equal(resolved.resolved, true);
  assert.equal(resolved.resolvedBy, 'gate_cleared');
});
