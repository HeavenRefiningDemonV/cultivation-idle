import assert from 'node:assert/strict';
import test from 'node:test';

import {
  applyDaoMandateVisibility,
  createDaoMandateFixture,
  type DaoMandateSurfaceV1,
} from '../../src/systems/ui/daoMandate/index.js';

function visibleLedgerCount(surface: DaoMandateSurfaceV1): number {
  return [
    ...surface.requirementLedger.hardGates,
    ...surface.requirementLedger.readinessFloors,
    ...surface.requirementLedger.supportReserves,
    ...surface.requirementLedger.sourceRoutes,
    ...surface.requirementLedger.optionalOptimizations,
    ...surface.requirementLedger.recentOmens,
  ].length;
}

test('P8 Guidance Oath profiles change visible density without mutating Mandate truth', () => {
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

  assert.ok(visibleLedgerCount(sealed) <= visibleLedgerCount(elder));
  assert.ok(visibleLedgerCount(elder) <= visibleLedgerCount(jade));
  assert.ok(sealed.lessonSlips.length <= elder.lessonSlips.length);
  assert.ok(elder.lessonSlips.length <= jade.lessonSlips.length);
});
