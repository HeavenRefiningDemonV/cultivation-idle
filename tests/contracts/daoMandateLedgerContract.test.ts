import assert from 'node:assert/strict';
import test from 'node:test';

import type { RunCompassBlockerKindV2, RunCompassBlockerV2 } from '../../src/systems/ui/runCompass/types.js';
import { buildDaoMandateSurfaceFromRunCompassV2 } from '../../src/systems/ui/daoMandate/index.js';
import { makeRunCompassV2Fixture } from '../helpers/daoMandate/runCompassFixture.js';

function surfaceForBlocker(kind: RunCompassBlockerKindV2, source: RunCompassBlockerV2['source'] = 'progression') {
  return buildDaoMandateSurfaceFromRunCompassV2(
    makeRunCompassV2Fixture({
      primaryBlocker: {
        kind,
        label: `Blocker ${kind}`,
        detail: `Detail for ${kind}`,
        severity: kind === 'attempt_gate_now' || kind === 'none' ? 'success' : 'warning',
        source,
        confidence: 'high',
      },
    }),
    { guidanceProfile: 'jade' },
  );
}

test('Dao Mandate ledger classifies hard gate blockers into hardGates', () => {
  for (const kind of ['life_setup_missing_path', 'breakthrough_qi_short', 'breakthrough_gate_proof_missing'] as const) {
    const surface = surfaceForBlocker(kind);

    assert.equal(surface.requirementLedger.hardGates.some((row) => row.id.includes(kind)), true);
    assert.equal(surface.requirementLedger.hardGates[0].bucket, 'hard_gate');
    assert.equal(surface.requirementLedger.hardGates[0].source, 'progression');
    assert.ok(surface.requirementLedger.hardGates[0].proofLine?.includes('Dao Mandate resolver'));
  }
});

test('Dao Mandate ledger classifies prep and build gaps as readiness floors', () => {
  for (const kind of ['forge_floor_shortfall', 'apothecary_prep_shortfall', 'build_correction_gap', 'manual_pavilion_gap'] as const) {
    const surface = surfaceForBlocker(kind, kind === 'build_correction_gap' ? 'build' : 'readiness');

    assert.equal(surface.requirementLedger.readinessFloors.some((row) => row.id.includes(kind)), true);
    assert.equal(surface.requirementLedger.readinessFloors[0].bucket, 'readiness_floor');
  }
});

test('Dao Mandate ledger classifies support reserves and safety net rows separately', () => {
  const meritSurface = surfaceForBlocker('bounty_merit_shortfall', 'economy');
  assert.equal(meritSurface.requirementLedger.supportReserves.some((row) => row.id.includes('bounty_merit_shortfall')), true);

  const safetySurface = surfaceForBlocker('safety_net_available', 'trial_lifecycle');
  assert.equal(safetySurface.requirementLedger.supportReserves.some((row) => row.id.includes('safety_net_available')), true);
  assert.equal(safetySurface.requirementLedger.supportReserves.some((row) => row.id.includes('safety-net')), true);
});

test('Dao Mandate ledger keeps attemptable and recent delta truth without inventing source maps', () => {
  const surface = surfaceForBlocker('attempt_gate_now', 'trial_lifecycle');

  assert.equal(surface.requirementLedger.optionalOptimizations.some((row) => row.id.includes('attempt_gate_now')), true);
  assert.equal(surface.requirementLedger.recentOmens.length, 1);
  assert.equal(surface.recentOmens.length, 1);
  assert.equal(Array.isArray(surface.sourceMap), true);
});

test('Dao Mandate current gate rows expose lifecycle and proof state from Run Compass context', () => {
  const surface = surfaceForBlocker('attempt_gate_now', 'trial_lifecycle');
  const labels = surface.requirementLedger.hardGates.map((row) => row.label);

  assert.equal(labels.some((label) => label.includes('Gate state')), true);
  assert.equal(labels.some((label) => label.includes('Gate proof')), true);
  assert.equal(surface.requirementLedger.hardGates.some((row) => row.detail.includes('Novice Clearing')), true);
});

test('Dao Mandate validates derived Safety Net world routes against visible current-city modules', () => {
  const surface = buildDaoMandateSurfaceFromRunCompassV2(
    makeRunCompassV2Fixture({
      currentCity: {
        cityId: 'city_pinewind_hamlet',
        cityName: 'Pinewind Hamlet',
        visibleModuleKeys: ['outskirts', 'manualPavilion', 'apothecary', 'forge', 'bounties', 'expeditions'],
        recommendedModuleKey: 'apothecary',
      },
      safetyNet: {
        state: 'available',
        label: 'Safety Net available',
        detail: 'Repeated eligible defeats can resolve the gate through city Merit support.',
        progressLine: 'Eligible defeats 3/3',
        target: { kind: 'world_module', cityId: 'city_pinewind_hamlet', moduleKey: 'gateTrial' },
      },
    }),
    { guidanceProfile: 'jade' },
  );

  assert.equal(surface.safetyNet?.route?.blocked, true);
  assert.match(surface.safetyNet?.route?.blockedReason ?? '', /not available|current live city/i);
  assert.equal(
    surface.requirementLedger.supportReserves.some((row) => row.route?.id === 'safety-net-available' && row.route.blocked),
    true,
  );
  assert.equal(
    surface.meta.debugNotes.some((note) => note.includes('safety-net-available') && note.includes('not visible')),
    true,
  );
});
