import assert from 'node:assert/strict';
import test from 'node:test';

import {
  DAO_MANDATE_FIXTURE_STATES,
  applyDaoMandateVisibility,
  createDaoMandateFixture,
  type DaoMandateSurfaceV1,
} from '../../src/systems/ui/daoMandate/index.js';

function ledgerDensity(surface: DaoMandateSurfaceV1): number {
  return surface.secondaryRoutes.length
    + surface.sourceMap.length
    + surface.lessonSlips.length
    + surface.requirementLedger.hardGates.length
    + surface.requirementLedger.readinessFloors.length
    + surface.requirementLedger.supportReserves.length
    + surface.requirementLedger.sourceRoutes.length
    + surface.requirementLedger.optionalOptimizations.length
    + surface.requirementLedger.recentOmens.length;
}

function assertProfileInvariantTruth(surface: DaoMandateSurfaceV1) {
  const sealed = applyDaoMandateVisibility(surface, { profile: 'sealed' });
  const elder = applyDaoMandateVisibility(surface, { profile: 'elder' });
  const jade = applyDaoMandateVisibility(surface, { profile: 'jade' });

  for (const visible of [sealed, elder, jade]) {
    assert.equal(visible.milestone.id, surface.milestone.id);
    assert.equal(visible.milestone.state, surface.milestone.state);
    assert.equal(visible.milestone.label, surface.milestone.label);
    assert.equal(visible.obstruction.kind, surface.obstruction.kind);
    assert.equal(visible.obstruction.label, surface.obstruction.label);
    assert.equal(visible.primaryRoute.id, surface.primaryRoute.id);
    assert.deepEqual(visible.primaryRoute.target, surface.primaryRoute.target);
    assert.equal(visible.primaryRoute.blocked, surface.primaryRoute.blocked);
    assert.equal(visible.prestige?.state ?? null, surface.prestige?.state ?? null);
  }

  assert.equal(ledgerDensity(jade) >= ledgerDensity(elder), true);
  assert.equal(ledgerDensity(elder) >= ledgerDensity(sealed), true);
}

test('Dao Mandate fixture profile filtering preserves truth and only changes display density', () => {
  for (const state of DAO_MANDATE_FIXTURE_STATES) {
    assertProfileInvariantTruth(createDaoMandateFixture(state, 'jade'));
  }
});

test('life setup fixture routes to Cultivation and exposes a hard setup gate', () => {
  const surface = createDaoMandateFixture('life_setup', 'jade');

  assert.equal(surface.milestone.state, 'life_setup');
  assert.equal(['life_setup_missing_path', 'life_setup_missing_heart_law'].includes(surface.obstruction.kind), true);
  assert.deepEqual(surface.primaryRoute.target, { kind: 'tab', tab: 'cultivation' });
  assert.equal(surface.requirementLedger.hardGates.length >= 1, true);
  assert.equal(surface.readiness.score, null);
  assert.deepEqual(surface.sourceMap, []);
  assert.deepEqual(surface.recentOmens, []);
});

test('cultivating Qi fixture keeps cultivation as the primary route', () => {
  const surface = createDaoMandateFixture('cultivating_qi_short', 'jade');

  assert.equal(surface.milestone.state, 'cultivating');
  assert.equal(['breakthrough_qi_short', 'gate_not_at_realm_edge'].includes(surface.obstruction.kind), true);
  assert.deepEqual(surface.primaryRoute.target, { kind: 'tab', tab: 'cultivation' });
  assert.equal(surface.requirementLedger.hardGates.some((row) => /Qi|realm/i.test(`${row.label} ${row.detail}`)), true);
  assert.equal(surface.secondaryRoutes.length > 0, true);
});

test('attemptable gate fixture routes to Gate Trial without claiming the gate is locked', () => {
  const surface = createDaoMandateFixture('attemptable_gate', 'jade');
  const hardGateText = surface.requirementLedger.hardGates.map((row) => `${row.label} ${row.detail}`).join(' ');

  assert.equal(surface.milestone.state, 'attemptable');
  assert.equal(['attempt_gate_now', 'none', 'readiness_shortfall'].includes(surface.obstruction.kind), true);
  assert.deepEqual(surface.primaryRoute.target, { kind: 'world_module', cityId: 'city_pinewind_hamlet', moduleKey: 'gateTrial' });
  assert.doesNotMatch(hardGateText, /locked/i);
  assert.ok(surface.readiness.label.length > 0);
});

test('gate failed fixture surfaces correction, recent omen, and safety net truth', () => {
  const surface = createDaoMandateFixture('gate_failed', 'jade');

  assert.equal(surface.milestone.state, 'gate_failed');
  assert.equal(['gate_recent_failure', 'forge_floor_shortfall', 'apothecary_prep_shortfall', 'build_correction_gap'].includes(surface.obstruction.kind), true);
  assert.ok(surface.primaryRoute.target);
  assert.equal(surface.recentOmens.length > 0, true);
  assert.ok(surface.safetyNet);
  assert.equal(surface.requirementLedger.readinessFloors.length + surface.requirementLedger.supportReserves.length > 0, true);
});

test('breakthrough pending fixture keeps breakthrough ahead of secondary prep routes', () => {
  const surface = createDaoMandateFixture('breakthrough_pending', 'jade');

  assert.equal(surface.milestone.state, 'breakthrough_pending');
  assert.equal(surface.obstruction.kind, 'none');
  assert.deepEqual(surface.primaryRoute.target, { kind: 'tab', tab: 'cultivation' });
  assert.match(`${surface.primaryRoute.label} ${surface.primaryRoute.actionLabel}`, /Break/i);
  assert.equal(surface.requirementLedger.hardGates.every((row) => row.state === 'met' || row.state === 'resolved'), true);
});

test('content cap fixture recommends Reincarnation honestly without exposing a future gate', () => {
  const surface = createDaoMandateFixture('content_cap_prestige_recommended', 'jade');
  const text = `${surface.milestone.label} ${surface.milestone.detail} ${surface.obstruction.detail}`;

  assert.equal(['content_cap', 'prestige_recommended'].includes(surface.milestone.state), true);
  assert.equal(['content_cap', 'prestige_recommended'].includes(surface.obstruction.kind), true);
  assert.deepEqual(surface.primaryRoute.target, { kind: 'tab', tab: 'prestige' });
  assert.equal(['cap_recommended', 'recommended', 'blocked'].includes(surface.prestige?.state ?? ''), true);
  assert.match(text, /No future gate|authored chapter/i);
  assert.doesNotMatch(text, /Unknown Gate/i);
});
