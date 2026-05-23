import assert from 'node:assert/strict';
import test from 'node:test';

import {
  applyDaoMandateVisibility,
  createDaoMandateFixture,
  type DaoMandateSurfaceV1,
} from '../../src/systems/ui/daoMandate/index.js';

function visibleLedgerKeys(surface: DaoMandateSurfaceV1): string[] {
  return [
    ...surface.requirementLedger.hardGates,
    ...surface.requirementLedger.readinessFloors,
    ...surface.requirementLedger.supportReserves,
    ...surface.requirementLedger.sourceRoutes,
    ...surface.requirementLedger.optionalOptimizations,
    ...surface.requirementLedger.recentOmens,
  ].map((row) => `${row.id}:${row.bucket}:${row.state}:${row.route?.id ?? 'none'}`);
}

test('legacy Guidance Oath profiles no longer change visible density or Mandate truth', () => {
  const raw = createDaoMandateFixture('gate_failed', 'jade');
  const rawSnapshot = JSON.stringify(raw);
  const sealed = applyDaoMandateVisibility(raw, { settings: { guidanceOath: 'sealed' } });
  const elder = applyDaoMandateVisibility(raw, { settings: { guidanceOath: 'elder' } });
  const jade = applyDaoMandateVisibility(raw, { settings: { guidanceOath: 'jade' } });

  assert.equal(JSON.stringify(raw), rawSnapshot);
  for (const filtered of [sealed, elder, jade]) {
    assert.equal(filtered.milestone.id, raw.milestone.id);
    assert.equal(filtered.obstruction.kind, raw.obstruction.kind);
    assert.equal(filtered.primaryRoute.id, raw.primaryRoute.id);
    assert.equal(filtered.primaryRoute.blocked, raw.primaryRoute.blocked);
    assert.deepEqual(filtered.primaryRoute.target, raw.primaryRoute.target);
    assert.equal(filtered.primaryRoute.expectedDeltaLabel, raw.primaryRoute.expectedDeltaLabel);
    assert.equal(filtered.safetyNet?.state ?? null, raw.safetyNet?.state ?? null);
    assert.equal(filtered.prestige?.state ?? null, raw.prestige?.state ?? null);
  }

  assert.deepEqual(visibleLedgerKeys(sealed), visibleLedgerKeys(elder));
  assert.deepEqual(visibleLedgerKeys(elder), visibleLedgerKeys(jade));
  assert.deepEqual(sealed.lessonSlips.map((slip) => slip.id), elder.lessonSlips.map((slip) => slip.id));
  assert.deepEqual(elder.lessonSlips.map((slip) => slip.id), jade.lessonSlips.map((slip) => slip.id));
  assert.deepEqual(sealed.sourceMap.map((entry) => entry.id), jade.sourceMap.map((entry) => entry.id));
  assert.deepEqual(sealed.backgroundPlan.routes.map((route) => route.id), jade.backgroundPlan.routes.map((route) => route.id));
});
