import assert from 'node:assert/strict';
import test from 'node:test';

import { buildStatusDashboardSurface } from '../../src/systems/ui/status/statusDashboardSurface.js';

function requirementKey(row: {
  kind: string;
  label: string;
  detail: string;
  sourceModuleLabel?: string | null;
  action?: { target: unknown } | null;
}) {
  return [
    row.kind,
    row.label.toLowerCase(),
    row.sourceModuleLabel ?? '',
    row.action?.target ? JSON.stringify(row.action.target) : '',
    row.detail.toLowerCase(),
  ].join('|');
}

test('Status Ledger row budgets remain bounded for old-look Status density', () => {
  const ledger = buildStatusDashboardSurface().statusLedger;

  assert.equal(ledger.metrics.length <= 9, true, 'metrics should fit old-look metric strip.');
  assert.equal(ledger.milestone.rows.length <= 5, true, 'milestone rows should be bounded.');
  assert.equal(ledger.milestone.nodes.length <= 4, true, 'milestone rail nodes should be bounded.');
  assert.equal(ledger.cultivationBase.rows.length <= 8, true, 'cultivation base rows should be bounded.');
  assert.equal(ledger.missionRequirements.rows.length <= 7, true, 'mission requirements rail should be capped.');
  assert.equal(ledger.bestImprovements.rows.length <= 4, true, 'best improvements must be one primary plus up to three secondary tips.');
  assert.equal(ledger.safetyNet.rows.length <= 5, true, 'safety net rows should be bounded.');
  assert.equal(ledger.identityDoctrine.rows.length <= 7, true, 'identity/doctrine rows should be bounded.');
  assert.equal(ledger.currentWork.rows.length <= 6, true, 'current work rows should be bounded.');
  assert.equal(ledger.buildPreparation.buildRows.length <= 7, true, 'build rows should be bounded.');
  assert.equal(ledger.buildPreparation.reserveRows.length <= 6, true, 'reserve rows should be bounded.');
  assert.equal(ledger.recentChanges.rows.length <= 4, true, 'recent changes should be bounded.');
  assert.equal(ledger.details.rows.length <= 8, true, 'details rows should stay folded and bounded.');
});

test('Mission Requirements are deduped and severe rows surface first', () => {
  const rows = buildStatusDashboardSurface().statusLedger.missionRequirements.rows;
  const unique = new Set(rows.map(requirementKey));
  assert.equal(unique.size, rows.length, 'Mission Requirements should not contain duplicate semantic rows.');

  const toneRank = { danger: 0, warning: 1, gold: 2, info: 3, jade: 4, success: 5, muted: 6 } as const;
  for (let index = 1; index < rows.length; index += 1) {
    const previousRow = rows[index - 1]!;
    const currentRow = rows[index]!;
    const previous = toneRank[previousRow.tone as keyof typeof toneRank] ?? 99;
    const current = toneRank[currentRow.tone as keyof typeof toneRank] ?? 99;
    assert.equal(
      previous <= current || previousRow.priorityLabel === 'Primary blocker',
      true,
      'Mission Requirements should be priority sorted.',
    );
  }
});

test('Best Improvements are capped, concrete, and not duplicated by target', () => {
  const improvements = buildStatusDashboardSurface().statusLedger.bestImprovements.rows;
  const targetKeys = new Set(improvements.map((action) => JSON.stringify(action.target)));
  assert.equal(targetKeys.size, improvements.length, 'Best Improvements should dedupe repeated targets.');

  const primaryCount = improvements.filter((action) => action.primary).length;
  assert.equal(primaryCount <= 1, true, 'At most one Best Improvement should be primary.');

  for (const action of improvements) {
    assert.equal(
      /Primary Route|Best Next Action|Biggest Shortfall|Mandate/i.test(action.label),
      false,
      `Action label should be concrete: ${action.label}`,
    );
  }
});
