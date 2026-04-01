import assert from 'node:assert/strict';
import test from 'node:test';

import { evaluateAiProfileFit } from '../../src/systems/builds/aiProfileFit.js';
import { getPathDoctrineProfile, getPathDoctrinePresentation } from '../../src/systems/doctrine/index.js';

const EMPTY_SIGNALS = {
  equippedFamilies: [],
  equippedSupportFlags: [],
  hasSurvivalTool: false,
  hasBossTool: false,
  hasFarmTool: false,
  hasSetupTool: false,
};

test('ai profile fit remains aligned with doctrine recommendations for routine and boss contexts', () => {
  const martial = getPathDoctrineProfile('martial');
  assert.ok(martial);
  assert.deepEqual(martial.recommendedAiByPhase.early, ['farmer', 'balanced']);
  assert.deepEqual(martial.recommendedAiByPhase.boss, ['burst', 'balanced']);

  const earlyFit = evaluateAiProfileFit({
    path: 'martial',
    aiProfile: 'balanced',
    encounterType: 'outskirts',
    loadoutSignals: EMPTY_SIGNALS,
  });
  assert.equal(earlyFit.rating, 'good');

  const bossFit = evaluateAiProfileFit({
    path: 'martial',
    aiProfile: 'farmer',
    encounterType: 'trial',
    loadoutSignals: EMPTY_SIGNALS,
  });
  assert.equal(bossFit.rating, 'bad');
  assert.equal(bossFit.warnings.includes('Farmer AI is a poor fit for gate trials.'), true);
});

test('path presentation and profile stay synchronized on objective line', () => {
  const heavenProfile = getPathDoctrineProfile('heaven');
  const heavenPresentation = getPathDoctrinePresentation('heaven');

  assert.ok(heavenProfile);
  assert.ok(heavenPresentation);
  assert.equal(heavenPresentation.objectiveLine, heavenProfile.objectiveLine);
  assert.ok((heavenPresentation.cautionLine ?? '').length > 0);
});
