import assert from 'node:assert/strict';
import test from 'node:test';

import {
  adaptPathDoctrineToSemanticView,
  adaptSpiritRootDoctrineToSemanticView,
  getPathDoctrineProfile,
} from '../../src/systems/doctrine/index.js';
import type { SpiritRoot } from '../../src/types/index.js';

test('path doctrine semantic adapter mirrors authored semantic fields without exposing runtime modifier payloads', () => {
  const semanticView = adaptPathDoctrineToSemanticView('heaven');
  const profile = getPathDoctrineProfile('heaven');

  assert.ok(semanticView);
  assert.ok(profile);
  assert.equal(semanticView.id, profile.id);
  assert.equal(semanticView.label, profile.label);
  assert.equal(semanticView.summary, profile.summary);
  assert.equal(semanticView.coreIdentity, profile.coreIdentity);

  assert.deepEqual(semanticView.playIdentityKeywords, profile.playIdentityKeywords);
  assert.deepEqual(semanticView.doctrineBudget, profile.doctrineBudget);
  assert.deepEqual(semanticView.prepBias, profile.prepBias);
  assert.deepEqual(semanticView.forgeBias, profile.forgeBias);
  assert.deepEqual(semanticView.buildBiasSummary, profile.buildBiasSummary);
  assert.deepEqual(semanticView.recommendedAiByPhase, profile.recommendedAiByPhase);
  assert.deepEqual(semanticView.commonFailureModes, profile.commonFailureModes);
  assert.equal(semanticView.objectiveLine, profile.objectiveLine);
  assert.equal('modifierSignature' in semanticView, false);
  assert.equal(Object.isFrozen(semanticView), true);
  assert.equal(Object.isFrozen(semanticView.prepBias), true);
  assert.equal(Object.isFrozen(semanticView.playIdentityKeywords), true);
  assert.equal(Object.isFrozen(semanticView.doctrineBudget), true);
  assert.equal(Object.isFrozen(semanticView.recommendedAiByPhase), true);
  assert.equal(Object.isFrozen(semanticView.recommendedAiByPhase.early), true);
});

test('path doctrine semantic adapter is null-safe', () => {
  assert.equal(adaptPathDoctrineToSemanticView(null), null);
});

test('spirit root semantic adapter derives bounded D.4 purity/power semantics', () => {
  const lowRoot: SpiritRoot = { grade: 1, element: 'fire', purity: 15 };
  const midRoot: SpiritRoot = { grade: 3, element: 'water', purity: 65 };
  const highRoot: SpiritRoot = { grade: 5, element: 'metal', purity: 100 };

  const lowView = adaptSpiritRootDoctrineToSemanticView(lowRoot);
  const midView = adaptSpiritRootDoctrineToSemanticView(midRoot);
  const highView = adaptSpiritRootDoctrineToSemanticView(highRoot);

  assert.ok(lowView);
  assert.equal(lowView.purityBand, 'muddy');
  assert.equal(lowView.powerBand, 'baseline');
  assert.equal(lowView.totalPowerDeltaPct <= 0.12, true);

  assert.ok(midView);
  assert.equal(midView.purityBand, 'stable');
  assert.equal(midView.powerBand, 'elevated');

  assert.ok(highView);
  assert.equal(highView.purityBand, 'immaculate');
  assert.equal(highView.powerBand, 'elite');
  assert.equal(highView.potencySummary.includes('cap 12%'), true);
  assert.equal(Object.isFrozen(highView), true);
});

test('spirit root semantic adapter stays null-safe and clamps malformed purity through the doctrine profile builder', () => {
  assert.equal(adaptSpiritRootDoctrineToSemanticView(null), null);

  const malformedRoot = { grade: 2, element: 'earth', purity: -20 } as SpiritRoot;
  const view = adaptSpiritRootDoctrineToSemanticView(malformedRoot);

  assert.ok(view);
  assert.equal(view.purity, 0);
  assert.equal(view.purityBand, 'muddy');
  assert.equal(view.powerBand, 'baseline');
});
