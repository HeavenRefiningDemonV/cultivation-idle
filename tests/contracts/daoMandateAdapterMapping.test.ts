import assert from 'node:assert/strict';
import test from 'node:test';

import { buildDaoMandateSurfaceFromRunCompassV2 } from '../../src/systems/ui/daoMandate/index.js';
import { makeRunCompassV2Fixture } from '../helpers/daoMandate/runCompassFixture.js';

test('Dao Mandate maps Run Compass milestone, obstruction, routes, and diagnostics without losing targets', () => {
  const runCompass = makeRunCompassV2Fixture();
  const surface = buildDaoMandateSurfaceFromRunCompassV2(runCompass, { guidanceProfile: 'jade' });

  assert.equal(surface.meta.mode, 'live');
  assert.equal(surface.meta.generatedAt, runCompass.generatedAt);
  assert.equal(surface.meta.sourceIds.includes('run_compass_v2'), true);
  assert.equal(surface.meta.debugNotes.includes('fixture debug note'), true);
  assert.equal(surface.milestone.id, runCompass.milestone.id);
  assert.equal(surface.milestone.label, runCompass.milestone.label);
  assert.equal(surface.milestone.state, runCompass.milestone.state);
  assert.equal(surface.milestone.currentCityId, runCompass.currentCity?.cityId);
  assert.equal(surface.milestone.currentCityName, runCompass.currentCity?.cityName);
  assert.equal(surface.obstruction.kind, runCompass.primaryBlocker.kind);
  assert.equal(surface.obstruction.label, runCompass.primaryBlocker.label);
  assert.equal(surface.obstruction.source, runCompass.primaryBlocker.source);
  assert.equal(surface.primaryRoute.id, runCompass.primaryRoute.id);
  assert.deepEqual(surface.primaryRoute.target, runCompass.primaryRoute.target);
  assert.deepEqual(surface.secondaryRoutes.map((route) => route.id), ['secondary-forge', 'secondary-cultivation']);
  assert.deepEqual(surface.secondaryRoutes.map((route) => route.target), [
    runCompass.secondaryRoutes[1].target,
    runCompass.secondaryRoutes[0].target,
  ]);
});

test('Dao Mandate maps Run Compass safety net, prestige hint, readiness, and recent deltas', () => {
  const runCompass = makeRunCompassV2Fixture();
  const surface = buildDaoMandateSurfaceFromRunCompassV2(runCompass, { guidanceProfile: 'jade' });

  assert.equal(surface.safetyNet?.state, 'available');
  assert.equal(surface.safetyNet?.label, runCompass.safetyNet?.label);
  assert.equal(surface.safetyNet?.progressLine, runCompass.safetyNet?.progressLine);
  assert.deepEqual(surface.safetyNet?.route?.target, runCompass.safetyNet?.target);
  assert.equal(surface.prestige?.state, 'viable');
  assert.equal(surface.prestige?.label, runCompass.prestigeHint?.label);
  assert.deepEqual(surface.prestige?.route?.target, runCompass.prestigeHint?.target);
  assert.equal(surface.readiness.score, runCompass.readiness.score);
  assert.equal(surface.readiness.rows.length, runCompass.readiness.rows.length);
  assert.equal(surface.readiness.rows[1].tone, 'warning');
  assert.equal(surface.recentOmens.length, 1);
  assert.equal(surface.recentOmens[0].id, runCompass.recentDeltas[0].id);
  assert.equal(surface.recentOmens[0].rewardSummary, '+300 Gold');
  assert.equal(surface.recentOmens[0].readinessDeltaLabel, '+12 readiness');
});
