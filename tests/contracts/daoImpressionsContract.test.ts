import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

import { useCultivationStore } from '../../src/stores/cultivationStore.js';
import {
  awardDaoImpression,
  buildDaoImpressionSurface,
  clearDaoImpressions,
  getDaoImpressionDefinition,
  useDaoImpressionStore,
} from '../../src/systems/daoImpressions/index.js';

function resetDaoTestState() {
  clearDaoImpressions();
  useCultivationStore.setState({
    selectedHeartLawId: 'heart_quiet_breath',
    chapter: 1,
    comprehension: 0,
    unlockedHeartLawIds: ['heart_quiet_breath'],
  });
}

test.beforeEach(resetDaoTestState);
test.afterEach(resetDaoTestState);

test('dao impressions expose typed surface without inventory or currency fields', () => {
  const definition = getDaoImpressionDefinition('threshold_revelation');
  assert.ok(definition);
  assert.equal(definition.sourceKind, 'gate_clear');
  assert.equal(definition.memoryEligible, true);

  const award = awardDaoImpression({
    impressionId: 'threshold_revelation',
    sourceKind: 'gate_clear',
    sourceEventKey: 'gate_clear:trial_novices_clearing:1',
    createdAt: 100,
    routeHint: { kind: 'cultivation', label: 'Return to Cultivation' },
  });

  assert.ok(award);
  const surface = buildDaoImpressionSurface(award);
  assert.equal(surface.version, 1);
  assert.match(surface.title, /Threshold Revelation/i);
  assert.match(surface.comprehensionLine, /\+15 Comprehension/i);
  assert.equal('currencies' in surface, false);
  assert.equal('items' in surface, false);
  assert.equal('inventory' in surface, false);
});

test('dao impression award is deduped by source event and applies comprehension once', () => {
  const first = awardDaoImpression({
    impressionId: 'threshold_revelation',
    sourceKind: 'gate_clear',
    sourceEventKey: 'gate_clear:trial_novices_clearing:1',
    createdAt: 100,
  });
  const second = awardDaoImpression({
    impressionId: 'threshold_revelation',
    sourceKind: 'gate_clear',
    sourceEventKey: 'gate_clear:trial_novices_clearing:1',
    createdAt: 101,
  });

  assert.ok(first);
  assert.equal(second, null);
  assert.equal(useDaoImpressionStore.getState().awards.length, 1);
  assert.equal(useCultivationStore.getState().comprehension, 15);
});

test('dao impression per-life caps block different source keys without a second reward grant', () => {
  const first = awardDaoImpression({
    impressionId: 'breakthrough_resonance',
    sourceKind: 'breakthrough_resonance',
    sourceEventKey: 'breakthrough:0->1',
    createdAt: 100,
  });
  const second = awardDaoImpression({
    impressionId: 'breakthrough_resonance',
    sourceKind: 'breakthrough_resonance',
    sourceEventKey: 'breakthrough:1->2',
    createdAt: 120,
  });

  assert.ok(first);
  assert.equal(second, null);
  assert.equal(useDaoImpressionStore.getState().awards.length, 1);
  assert.equal(useCultivationStore.getState().comprehension, 8);
});

test('dao impression cooldown blocks repeated close-defeat awards with different source keys', () => {
  const first = awardDaoImpression({
    impressionId: 'gate_guardian_pattern',
    sourceKind: 'gate_close_defeat',
    sourceEventKey: 'gate_close_defeat:trial_novices_clearing:1:close:a1',
    createdAt: 1_000,
  });
  const second = awardDaoImpression({
    impressionId: 'gate_guardian_pattern',
    sourceKind: 'gate_close_defeat',
    sourceEventKey: 'gate_close_defeat:trial_novices_clearing:1:close:a2',
    createdAt: 1_000 + 60_000,
  });

  assert.ok(first);
  assert.equal(second, null);
  assert.equal(useDaoImpressionStore.getState().awards.length, 1);
  assert.equal(useCultivationStore.getState().comprehension, 6);

  clearDaoImpressions();

  const afterReset = awardDaoImpression({
    impressionId: 'gate_guardian_pattern',
    sourceKind: 'gate_close_defeat',
    sourceEventKey: 'gate_close_defeat:trial_novices_clearing:1:close:a3',
    createdAt: 1_000 + 60_000,
  });
  assert.ok(afterReset);
  assert.equal(useDaoImpressionStore.getState().awards.length, 1);
});

test('future-only manual insight cannot be awarded from live P5 paths', () => {
  const award = awardDaoImpression({
    impressionId: 'manual_insight',
    sourceKind: 'technique_mastery_milestone',
    sourceEventKey: 'technique_mastery:tech_basic_slash:5',
    createdAt: 100,
  });

  assert.equal(award, null);
  assert.equal(useDaoImpressionStore.getState().awards.length, 0);
  assert.equal(useCultivationStore.getState().comprehension, 0);
});

test('ruins boss chest is not exposed as a live source kind without a real trigger', () => {
  const typesSource = readFileSync('src/systems/daoImpressions/types.ts', 'utf8');
  const eventsSource = readFileSync('src/services/events/GameEvents.ts', 'utf8');

  assert.equal(typesSource.includes("'ruins_boss_chest'"), false);
  assert.equal(eventsSource.includes("'ruins_boss_chest'"), false);
});

test('no selected heart law records a safe skipped state without crashing', () => {
  useCultivationStore.setState({ selectedHeartLawId: null, comprehension: 0 });

  const award = awardDaoImpression({
    impressionId: 'first_boss_pattern',
    sourceKind: 'outskirts_first_boss',
    sourceEventKey: 'outskirts_first_boss:city_pinewind_hamlet:outskirts_pinewind:enemy_boss',
    createdAt: 100,
  });

  assert.ok(award);
  assert.equal(award.applied, false);
  assert.equal(award.skippedReason, 'no_selected_heart_law');
  assert.equal(award.targetHeartLawId, null);
  assert.match(award.memoryLine, /Heart Law/i);
  assert.equal(useCultivationStore.getState().comprehension, 0);
});
