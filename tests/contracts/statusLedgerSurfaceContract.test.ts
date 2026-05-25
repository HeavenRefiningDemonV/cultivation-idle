import assert from 'node:assert/strict';
import test from 'node:test';

import { buildStatusDashboardSurface } from '../../src/systems/ui/status/statusDashboardSurface.js';
import { useTrialStore } from '../../src/stores/trialStore.js';

function expectNonEmpty(value: string, label: string) {
  assert.equal(typeof value, 'string', `${label} should be a string.`);
  assert.equal(value.trim().length > 0, true, `${label} should be non-empty.`);
}

test('Status dashboard exposes StatusLedgerSurfaceV1 for Packet C renderer', () => {
  const surface = buildStatusDashboardSurface(123456789);
  const ledger = surface.statusLedger;

  assert.ok(ledger, 'surface.statusLedger should exist.');
  assert.equal(ledger.meta.rootTestId, 'status-ledger');
  assert.equal(ledger.meta.schemaVersion, 'status-ledger-v1');
  assert.equal(ledger.meta.generatedAt, 123456789);
  assert.equal(typeof ledger.meta.contentLoaded, 'boolean');

  expectNonEmpty(ledger.hero.realmName, 'hero.realmName');
  expectNonEmpty(ledger.hero.stageText, 'hero.stageText');
  expectNonEmpty(ledger.hero.pathLabel, 'hero.pathLabel');
  expectNonEmpty(ledger.hero.heartLawLabel, 'hero.heartLawLabel');
  expectNonEmpty(ledger.hero.spiritRootLabel, 'hero.spiritRootLabel');
  expectNonEmpty(ledger.hero.cityLabel, 'hero.cityLabel');
  expectNonEmpty(ledger.hero.nextMajorGoalLabel, 'hero.nextMajorGoalLabel');
  expectNonEmpty(ledger.hero.mainBottleneckLabel, 'hero.mainBottleneckLabel');

  assert.equal(ledger.milestone.title, 'Milestone');
  assert.equal(ledger.cultivationBase.title, 'Cultivation Base');
  assert.equal(ledger.missionRequirements.title, 'Mission Requirements');
  assert.equal(ledger.bestImprovements.title, 'Best Improvements');
  assert.equal(ledger.safetyNet.title, 'Safety Net');
  assert.equal(ledger.identityDoctrine.title, 'Identity & Doctrine');
  assert.equal(ledger.currentWork.title, 'Current Work');
  assert.equal(ledger.buildPreparation.title, 'Build & Preparation');
  assert.equal(ledger.recentChanges.title, 'Recent Changes');
  assert.equal(ledger.details.title, 'How calculated');
  assert.equal(ledger.details.closedByDefault, true);
});

test('Status Ledger includes cultivation state and current work state', () => {
  const ledger = buildStatusDashboardSurface().statusLedger;

  const metricLabels = ledger.metrics.map((row) => row.label);
  assert.ok(metricLabels.some((label) => /Qi/i.test(label)), 'metrics should include Qi or Qi/s.');
  assert.ok(
    metricLabels.some((label) => /Attack|Combat Strength|Defense|Crit/i.test(label)),
    'metrics should keep combat scan values.',
  );

  const cultivationLines = ledger.cultivationBase.rows.map((row) => `${row.label} ${row.value ?? ''} ${row.detail}`);
  assert.ok(cultivationLines.some((line) => /Qi/i.test(line)), 'Cultivation Base should include Qi.');
  assert.ok(
    cultivationLines.some((line) => /rate|Qi \/ s|Qi\/s|Cultivation/i.test(line)),
    'Cultivation Base should include rate.',
  );
  assert.ok(cultivationLines.some((line) => /Stability|stable/i.test(line)), 'Cultivation Base should include stability.');
  assert.ok(
    cultivationLines.some((line) => /Focus|Breath|Heart Law|Chapter/i.test(line)),
    'Cultivation Base should include doctrine posture.',
  );

  assert.ok(ledger.currentWork.rows.length >= 1, 'Current Work should always include at least foreground state.');
  assert.ok(
    ledger.currentWork.rows.some((row) => (
      row.id.includes('foreground') ||
      /foreground|idle|cultivat|trial|outskirts|ruins|forge/i.test(`${row.label} ${row.detail}`)
    )),
    'Current Work should include foreground state.',
  );
});

test('Status Ledger build is read-only and does not initialize trial progress', () => {
  useTrialStore.getState().hardResetTrials();
  assert.deepEqual(useTrialStore.getState().progressByTrialId, {});

  buildStatusDashboardSurface();

  assert.deepEqual(
    useTrialStore.getState().progressByTrialId,
    {},
    'Status Ledger builder must not initialize trial progress.',
  );
});
