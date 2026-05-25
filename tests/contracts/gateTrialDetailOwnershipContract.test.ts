import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

import { createGateTrialExactMockupFixture } from '../../src/features/world/gateTrialExact/buildGateTrialExactSurface.js';

function readSource(path: string): string {
  return readFileSync(path, 'utf8');
}

test('Gate Trial target keeps native readiness ownership without Dao proof/source handoff as the future contract', () => {
  const surface = createGateTrialExactMockupFixture();
  const agents = readSource('AGENTS.md');
  const releasePlan = readSource('docs/release/status_v3_dao_decommission_plan.md');

  assert.equal(surface.minimumChecklist.rows.length >= 1, true);
  assert.equal(surface.recommendedPanel.prepRows.length >= 1, true);
  assert.equal(surface.recommendedPanel.failSafeRows.length >= 1, true);
  assert.equal(surface.trialSummary.rows.length >= 1, true);
  assert.equal(surface.readinessRail.nodes.length >= 1, true);

  assert.match(`${agents}\n${releasePlan}`, /Gate Trial explains gate readiness/i);
  assert.match(`${agents}\n${releasePlan}`, /minimum checklist|recommended prep|fail-safe|trial summary|readiness/i);
});

test('Packet D Gate Trial public UI removes Mandate lens and detail handoff', () => {
  const gateScreen = readSource('src/features/world/gateTrialExact/GateTrialExactScreen.ts');
  const gateTypes = readSource('src/features/world/gateTrialExact/gateTrialExactTypes.ts');
  const gateBuilder = readSource('src/features/world/gateTrialExact/buildGateTrialExactSurface.ts');

  for (const source of [gateScreen, gateTypes, gateBuilder]) {
    assert.doesNotMatch(source, /LocalMandateLensHeader|detailOwnership|Gate Evidence|Proof Detail|Source Thread|status-snapshot-only|cultivation-compact-only/);
  }
});

test('Gate Trial exact renderer stays pure while action ownership remains external', () => {
  const screenSource = readSource('src/features/world/gateTrialExact/GateTrialExactScreen.ts');

  for (const forbidden of [
    /use[A-Z].*Store/,
    /RewardService/,
    /grantRewards/,
    /spendCurrency/,
    /recordFailure/,
    /markCleared/,
    /markBypassed/,
    /startCombat\(/,
    /breakthrough\(/,
    /getTrialLifecycleSnapshot/,
  ]) {
    assert.doesNotMatch(screenSource, forbidden);
  }
});
