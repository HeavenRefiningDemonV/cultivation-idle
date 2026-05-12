import assert from 'node:assert/strict';
import test from 'node:test';

import {
  buildStatusCombatMetrics,
  classifyDashboardIssueTone,
  getRunCompassActionState,
} from '../../src/ui/status/statusDashboardModel.js';

test('status dashboard combat metrics match the compact mockup strip contract', () => {
  const metrics = buildStatusCombatMetrics({
    hp: '375',
    atk: '91.18',
    def: '27.1',
    crit: 15,
  });

  assert.deepEqual(metrics.map((entry) => [entry.id, entry.label, entry.value]), [
    ['combat_strength', 'Combat Strength', '508.28'],
    ['attack', 'Attack', '91.18'],
    ['defense', 'Defense', '27.1'],
    ['crit_rate', 'Crit Rate', '15%'],
  ]);
});

test('status dashboard action state distinguishes runnable, blocked, and settled rows', () => {
  assert.deepEqual(
    getRunCompassActionState({ blocked: false, target: { kind: 'tab', tab: 'cultivation' } }),
    { label: 'Go', disabled: false, tone: 'go' },
  );

  assert.deepEqual(
    getRunCompassActionState({ blocked: true, target: { kind: 'tab', tab: 'cultivation' } }),
    { label: 'Blocked', disabled: true, tone: 'blocked' },
  );

  assert.deepEqual(
    getRunCompassActionState({ blocked: true, target: null }),
    { label: 'Check', disabled: true, tone: 'settled' },
  );
});

test('status dashboard issue tone classifies danger, warning, info, and success rows', () => {
  assert.equal(classifyDashboardIssueTone('Balanced AI is under-supported'), 'danger');
  assert.equal(classifyDashboardIssueTone('Combat consumable auto-use is disabled.'), 'warning');
  assert.equal(classifyDashboardIssueTone('Visible - Restock via Apothecary'), 'info');
  assert.equal(classifyDashboardIssueTone('No major blocker surfaced.'), 'success');
});
