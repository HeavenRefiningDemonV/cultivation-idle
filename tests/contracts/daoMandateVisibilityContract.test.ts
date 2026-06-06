import assert from 'node:assert/strict';
import test from 'node:test';

import {
  DAO_MANDATE_FIXTURE_STATES,
  applyDaoMandateVisibility,
  buildDaoMandateSurfaceFromRunCompassV2,
  createDaoMandateFixture,
  type DaoMandateSurfaceV1,
} from '../../src/systems/ui/daoMandate/index.js';
import { makeRunCompassV2Fixture } from '../helpers/daoMandate/runCompassFixture.js';

function visibleLedgerRows(surface: DaoMandateSurfaceV1) {
  return [
    ...surface.requirementLedger.hardGates,
    ...surface.requirementLedger.readinessFloors,
    ...surface.requirementLedger.supportReserves,
    ...surface.requirementLedger.sourceRoutes,
    ...surface.requirementLedger.optionalOptimizations,
    ...surface.requirementLedger.recentOmens,
  ];
}

function makeReadinessShortfallWithAttemptableGateSurface(): DaoMandateSurfaceV1 {
  return buildDaoMandateSurfaceFromRunCompassV2(
    makeRunCompassV2Fixture({
      milestone: {
        id: 'preparing:qi_condensation:trial_novices_clearing',
        state: 'preparing',
        label: 'Prepare for Novice Clearing',
        detail: 'Gate proof is visible, but survival floor is still thin.',
        currentRealmLabel: 'Qi Condensation',
        nextRealmLabel: 'Foundation Establishment',
        contextLine: 'Qi Condensation -> Foundation Establishment',
        chapterLine: 'Current city: Pinewind Hamlet',
      },
      primaryBlocker: {
        kind: 'readiness_shortfall',
        label: 'Medicine floor is thin',
        detail: 'Raise the preparation floor before attempting the gate.',
        severity: 'warning',
        source: 'readiness',
        confidence: 'high',
      },
      primaryRoute: {
        id: 'raise-medicine-floor',
        label: 'Raise Medicine Floor',
        actionLabel: 'Open Apothecary',
        detail: 'Prepare enough medicine before the gate attempt.',
        destinationLabel: 'Apothecary',
        target: { kind: 'world_module', cityId: 'city_pinewind_hamlet', moduleKey: 'apothecary' },
        blocked: false,
        blockedReason: null,
        source: 'readiness',
        expectedDeltaLabel: 'Medicine floor improves.',
        priority: 30,
      },
      currentGate: {
        trialId: 'trial_novices_clearing',
        gateLabel: 'Novice Clearing',
        fromRealmLabel: 'Qi Condensation',
        toRealmLabel: 'Foundation Establishment',
        gateProofItemId: 'gate_foundation_pill',
        gateProofItemName: 'Gate Foundation Pill',
        lifecycleState: 'available',
        resolved: false,
        canAttempt: true,
        canBreakthrough: false,
        failSafeAvailable: false,
      },
    }),
    { guidanceProfile: 'jade' },
  );
}

test('legacy profile visibility preserves both primary readiness and current-gate proof rows', () => {
  const raw = makeReadinessShortfallWithAttemptableGateSurface();
  const sealed = applyDaoMandateVisibility(raw, { profile: 'sealed' });
  const rows = visibleLedgerRows(sealed);

  assert.equal(sealed.obstruction.kind, 'readiness_shortfall');
  assert.equal(sealed.primaryRoute.id, raw.primaryRoute.id);
  assert.equal(rows.some((row) => row.id === 'primary-readiness_shortfall' && row.bucket === 'readiness_floor'), true);
  assert.equal(rows.some((row) => row.id.startsWith('gate-proof-') && row.bucket === 'hard_gate'), true);
});

test('Elder visibility preserves the primary obstruction row while staying denser than Sealed and no denser than Jade', () => {
  const raw = makeReadinessShortfallWithAttemptableGateSurface();
  const sealed = applyDaoMandateVisibility(raw, { profile: 'sealed' });
  const elder = applyDaoMandateVisibility(raw, { profile: 'elder' });
  const jade = applyDaoMandateVisibility(raw, { profile: 'jade' });
  const elderRows = visibleLedgerRows(elder);

  assert.equal(elderRows.some((row) => row.id === 'primary-readiness_shortfall'), true);
  assert.equal(
    elderRows.some((row) => row.id.startsWith('gate-')) &&
      !elderRows.some((row) => row.id === 'primary-readiness_shortfall'),
    false,
  );
  assert.equal(visibleLedgerRows(elder).length >= visibleLedgerRows(sealed).length, true);
  assert.equal(visibleLedgerRows(jade).length >= visibleLedgerRows(elder).length, true);
});

test('Elder visibility does not attach unrelated primary routes to gate proof rows', () => {
  const raw = makeReadinessShortfallWithAttemptableGateSurface();
  const elder = applyDaoMandateVisibility(raw, { profile: 'elder' });
  const gateRows = visibleLedgerRows(elder).filter((row) => row.id.startsWith('gate-'));

  assert.equal(gateRows.length > 0, true);
  for (const row of gateRows) {
    if (!row.route) continue;
    assert.deepEqual(row.route.target, {
      kind: 'world_module',
      cityId: 'city_pinewind_hamlet',
      moduleKey: 'gateTrial',
    });
  }
});

test('Dao Mandate fixture legacy profiles preserve the same ledger density', () => {
  for (const state of DAO_MANDATE_FIXTURE_STATES) {
    const raw = createDaoMandateFixture(state, 'jade');
    const sealed = applyDaoMandateVisibility(raw, { profile: 'sealed' });
    const elder = applyDaoMandateVisibility(raw, { profile: 'elder' });
    const jade = applyDaoMandateVisibility(raw, { profile: 'jade' });

    assert.deepEqual(
      visibleLedgerRows(sealed).map((row) => row.id),
      visibleLedgerRows(raw).map((row) => row.id),
    );
    assert.deepEqual(
      visibleLedgerRows(elder).map((row) => row.id),
      visibleLedgerRows(raw).map((row) => row.id),
    );
    assert.deepEqual(
      visibleLedgerRows(jade).map((row) => row.id),
      visibleLedgerRows(raw).map((row) => row.id),
    );
  }
});
