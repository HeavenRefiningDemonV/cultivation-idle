import assert from 'node:assert/strict';
import test from 'node:test';

import {
  getFirstLifeCapBandSeconds,
  getFoundationEntryWindowSeconds,
  getGate1AvailabilityWindowSeconds,
  getPhaseTargetDurationsSeconds,
} from '../../src/systems/balance/phaseTimingTargets.js';
import { runPhaseTimingProbe } from '../helpers/balance/runPhaseTimingProbe.js';

const toMinutes = (seconds: number) => seconds / 60;

test('deterministic phase timing probe validates full semester ladder, drift slack, and cap band', async () => {
  const probe = await runPhaseTimingProbe();

  assert.ok(probe.gate1AvailableMs !== null);
  assert.ok(probe.foundationEntryMs !== null);

  const gate1Window = getGate1AvailabilityWindowSeconds();
  const foundationWindow = getFoundationEntryWindowSeconds();

  const gate1Seconds = (probe.gate1AvailableMs ?? 0) / 1000;
  const foundationSeconds = (probe.foundationEntryMs ?? 0) / 1000;

  assert.ok(gate1Seconds >= gate1Window.minSeconds, `Gate 1 availability too early: ${toMinutes(gate1Seconds).toFixed(2)}m`);
  assert.ok(gate1Seconds <= gate1Window.maxSeconds, `Gate 1 availability too late: ${toMinutes(gate1Seconds).toFixed(2)}m`);
  assert.ok(foundationSeconds >= foundationWindow.minSeconds, `Foundation entry too early: ${toMinutes(foundationSeconds).toFixed(2)}m`);
  assert.ok(foundationSeconds <= foundationWindow.maxSeconds, `Foundation entry too late: ${toMinutes(foundationSeconds).toFixed(2)}m`);

  const report = probe.phaseTimingReport;
  const phaseTargets = getPhaseTargetDurationsSeconds();
  assert.equal(report.phaseDurations.length, phaseTargets.length);
  for (const phase of report.phaseDurations) {
    assert.ok(phase.actualSeconds !== null, `Missing actual seconds for ${phase.phaseId}`);
    assert.equal(phase.withinValidationSlack, true, `${phase.phaseId} drift out of slack: ${phase.driftSeconds}s`);
  }

  const cumulativeSeconds = report.cumulativeMilestones
    .map((row) => row.actualSecondsFromLifeStart)
    .filter((value): value is number => typeof value === 'number');
  for (let idx = 1; idx < cumulativeSeconds.length; idx += 1) {
    assert.ok(cumulativeSeconds[idx] > cumulativeSeconds[idx - 1]);
  }

  const capBand = getFirstLifeCapBandSeconds();
  assert.ok((report.capSecondsFromLifeStart ?? 0) >= capBand.minSeconds);
  assert.ok((report.capSecondsFromLifeStart ?? 0) <= capBand.maxSeconds);
  assert.equal(report.capWithinBand, true);

  assert.equal(probe.finalCityId, 'city_ironpeak_bastion');
  assert.equal(probe.finalRealmId, 'spirit_severing');

  const eventTypes = probe.progressionEvents.map((event) => event.type);
  assert.equal(eventTypes.filter((type) => type === 'progression/life_started').length, 1);
  assert.equal(eventTypes.filter((type) => type === 'progression/gate_available').length, 5);
  assert.equal(eventTypes.filter((type) => type === 'progression/gate_resolved').length, 5);
  assert.equal(eventTypes.filter((type) => type === 'progression/content_cap_reached').length, 1);

  const cityEntered = probe.progressionEvents.filter((event) => event.type === 'progression/city_entered');
  const cityIds = cityEntered.map((event) => event.payload.cityId);
  assert.deepEqual(cityIds, ['city_stonecrag_town', 'city_spirit_cavern_city', 'city_lotusford', 'city_ironpeak_bastion']);
  assert.equal(cityIds.includes('city_spirit_severing'), false);

  const breakthroughs = probe.progressionEvents.filter(
    (event) => event.type === 'progression/breakthrough' && event.payload.major,
  );
  const majorBreakthroughRealmIndexes = breakthroughs
    .map((event) => (event.type === 'progression/breakthrough' ? event.payload.toRealmIndex : null))
    .filter((value): value is number => typeof value === 'number');
  assert.deepEqual(
    majorBreakthroughRealmIndexes,
    [1, 2, 3, 4, 5],
  );

  const canonicalCityUnlockOrder = ['city_pinewind_hamlet', 'city_stonecrag_town', 'city_spirit_cavern_city', 'city_lotusford', 'city_ironpeak_bastion'];
  assert.deepEqual(canonicalCityUnlockOrder.at(-1), probe.finalCityId);
});
