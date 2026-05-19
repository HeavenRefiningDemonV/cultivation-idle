import assert from 'node:assert/strict';
import test from 'node:test';

import { validateLoadedContent } from '../../src/content/index.js';
import { buildAllPrepPackageFitReports } from '../../src/systems/economy/prepPackageFitReadModel.js';
import { loadRawProgressionContent } from '../fixtures/progression/loadFixtureContext.js';

test('prep package fit audit keeps all five recommended packages economically honest and live-sourced', async () => {
  const validated = validateLoadedContent((await loadRawProgressionContent()) as never);
  const reports = buildAllPrepPackageFitReports(validated);
  assert.equal(reports.length, 5);

  for (const report of reports) {
    assert.equal(report.honest, true, `${report.transitionId} should be honest`);
    assert.equal(report.directCore.every((line) => line.coverageMode !== 'unsupported'), true, `${report.transitionId} must cover all direct lines`);
    assert.equal(report.supplementLanes.every((lane) => lane.hasAtLeastOneHonestOption), true, `${report.transitionId} supplement lanes need one honest option`);
    assert.equal(report.sourceRealism.noNonLiveConsumableDependencies, true, `${report.transitionId} must stay in live consumable roster`);
    assert.equal(report.sourceRealism.noPostGateOnlyDependencies, true, `${report.transitionId} cannot rely on post-gate-only sources`);
    assert.equal(report.goldBudgetFit.fitsMinimumRange, true, `${report.transitionId} should fit minimum spend envelope`);
    assert.equal(report.goldBudgetFit.fitsRecommendedRange, true, `${report.transitionId} should fit recommended spend envelope`);
  }

  const lateCity = reports.find((entry) => entry.cityId === 'city_ironpeak_bastion');
  assert.ok(lateCity);
  const cappedLines = lateCity.directCore.filter((line) => line.directDailyLimit !== null && line.convenienceShareOfDailyLimit !== null && line.convenienceShareOfDailyLimit > 0.7);
  assert.ok(cappedLines.length > 0, 'late city should include at least one tight-cap direct line');
  assert.equal(cappedLines.every((line) => line.visibleLiveBrewSupport), true, 'tight-cap lines must have live brew support');
});
