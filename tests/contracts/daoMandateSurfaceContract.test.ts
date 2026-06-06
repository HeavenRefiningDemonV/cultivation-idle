import assert from 'node:assert/strict';
import test from 'node:test';

import {
  DAO_MANDATE_FIXTURE_STATES,
  buildDaoMandateSurfaceFromRunCompassV2,
  createDaoMandateFixture,
  type DaoMandateRoute,
  type DaoMandateSurfaceV1,
} from '../../src/systems/ui/daoMandate/index.js';

function collectUndefinedPaths(value: unknown, path = 'surface'): string[] {
  if (value === undefined) return [path];
  if (value === null || typeof value !== 'object') return [];
  return Object.entries(value as Record<string, unknown>).flatMap(([key, entry]) =>
    collectUndefinedPaths(entry, `${path}.${key}`),
  );
}

function collectRoutes(surface: DaoMandateSurfaceV1): DaoMandateRoute[] {
  const rows = [
    ...surface.requirementLedger.hardGates,
    ...surface.requirementLedger.readinessFloors,
    ...surface.requirementLedger.supportReserves,
    ...surface.requirementLedger.sourceRoutes,
    ...surface.requirementLedger.optionalOptimizations,
    ...surface.requirementLedger.recentOmens,
    ...surface.readiness.rows,
  ];
  return [
    surface.primaryRoute,
    ...surface.secondaryRoutes,
    ...rows.flatMap((row) => (row.route ? [row.route] : [])),
    ...surface.backgroundPlan.routes,
    ...(surface.safetyNet?.route ? [surface.safetyNet.route] : []),
    ...(surface.prestige?.route ? [surface.prestige.route] : []),
    ...surface.sourceMap.flatMap((entry) => [
      ...(entry.route ? [entry.route] : []),
      ...entry.bestSources.flatMap((source) => (source.route ? [source.route] : [])),
      ...entry.fallbackSources.flatMap((source) => (source.route ? [source.route] : [])),
    ]),
  ];
}

function assertSurfaceArrays(surface: DaoMandateSurfaceV1) {
  assert.equal(Array.isArray(surface.secondaryRoutes), true);
  assert.equal(Array.isArray(surface.requirementLedger.hardGates), true);
  assert.equal(Array.isArray(surface.requirementLedger.readinessFloors), true);
  assert.equal(Array.isArray(surface.requirementLedger.supportReserves), true);
  assert.equal(Array.isArray(surface.requirementLedger.sourceRoutes), true);
  assert.equal(Array.isArray(surface.requirementLedger.optionalOptimizations), true);
  assert.equal(Array.isArray(surface.requirementLedger.recentOmens), true);
  assert.equal(Array.isArray(surface.readiness.rows), true);
  assert.equal(Array.isArray(surface.sourceMap), true);
  assert.equal(Array.isArray(surface.currentWork.queues), true);
  assert.equal(Array.isArray(surface.backgroundPlan.routes), true);
  assert.equal(Array.isArray(surface.recentOmens), true);
  assert.equal(Array.isArray(surface.lessonSlips), true);
}

function assertRoutesAreSafe(surface: DaoMandateSurfaceV1) {
  for (const route of collectRoutes(surface)) {
    assert.ok(route.id.length > 0);
    assert.ok(route.label.length > 0);
    assert.ok(route.actionLabel.length > 0);
    assert.ok(route.destinationLabel.length > 0);
    if (route.blocked) {
      assert.ok(route.blockedReason, `${route.id} is blocked without a reason`);
    } else {
      assert.ok(route.target, `${route.id} is enabled without a target`);
    }
  }
}

test('Dao Mandate adapter returns a complete fallback surface when Run Compass is unavailable', () => {
  const surface = buildDaoMandateSurfaceFromRunCompassV2(null, { now: 123 });

  assert.equal(surface.meta.version, 1);
  assert.equal(surface.meta.mode, 'fallback');
  assert.equal(surface.meta.generatedAt, 123);
  assert.equal(surface.meta.guidanceProfile, 'elder');
  assert.equal(surface.meta.confidence, 'low');
  assert.equal(surface.milestone.state, 'fallback');
  assert.equal(surface.obstruction.kind, 'unknown');
  assertSurfaceArrays(surface);
  assertRoutesAreSafe(surface);
  assert.deepEqual(collectUndefinedPaths(surface), []);
});

test('Dao Mandate fixtures expose stable complete surfaces for every required state', () => {
  for (const state of DAO_MANDATE_FIXTURE_STATES) {
    const surface = createDaoMandateFixture(state, 'jade');

    assert.equal(surface.meta.version, 1);
    assert.equal(surface.meta.mode, 'fixture');
    assert.equal(surface.meta.guidanceProfile, 'elder');
    assert.ok(surface.milestone.id.includes(state));
    assert.ok(surface.milestone.label.length > 0);
    assert.ok(surface.obstruction.label.length > 0);
    assert.ok(surface.primaryRoute.id.length > 0);
    assertSurfaceArrays(surface);
    assertRoutesAreSafe(surface);
    assert.deepEqual(collectUndefinedPaths(surface), []);
  }
});
