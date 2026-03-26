import assert from 'node:assert/strict';
import test from 'node:test';

import { getFoundationEntryWindowSeconds, getGate1AvailabilityWindowSeconds } from '../../src/systems/balance/phaseTimingTargets.js';
import { runPhaseTimingProbe } from '../helpers/balance/runPhaseTimingProbe.js';

const toMinutes = (ms: number) => ms / 1000 / 60;

test('deterministic phase timing probe hits early timing envelopes and emits sane progression ordering', async () => {
  const probe = await runPhaseTimingProbe();

  assert.ok(probe.gate1AvailableMs !== null);
  assert.ok(probe.foundationEntryMs !== null);

  const gate1Window = getGate1AvailabilityWindowSeconds();
  const foundationWindow = getFoundationEntryWindowSeconds();

  const gate1Ms = probe.gate1AvailableMs ?? 0;
  const foundationMs = probe.foundationEntryMs ?? 0;

  assert.ok(gate1Ms >= gate1Window.minSeconds * 1000, `Gate 1 availability too early: ${toMinutes(gate1Ms).toFixed(2)}m`);
  assert.ok(gate1Ms <= gate1Window.maxSeconds * 1000, `Gate 1 availability too late: ${toMinutes(gate1Ms).toFixed(2)}m`);
  assert.ok(foundationMs >= foundationWindow.minSeconds * 1000, `Foundation entry too early: ${toMinutes(foundationMs).toFixed(2)}m`);
  assert.ok(foundationMs <= foundationWindow.maxSeconds * 1000, `Foundation entry too late: ${toMinutes(foundationMs).toFixed(2)}m`);

  const eventTypes = probe.progressionEvents.map((event) => event.type);
  const lifeStartedIndex = eventTypes.indexOf('progression/life_started');
  const gateAvailableIndex = eventTypes.indexOf('progression/gate_available');
  const gateResolvedIndex = eventTypes.indexOf('progression/gate_resolved');
  const majorBreakthroughIndex = probe.progressionEvents.findIndex(
    (event) => event.type === 'progression/breakthrough' && event.payload.major === true,
  );
  const cityEnteredIndex = eventTypes.indexOf('progression/city_entered');

  assert.ok(lifeStartedIndex >= 0);
  assert.ok(gateAvailableIndex > lifeStartedIndex);
  assert.ok(gateResolvedIndex > gateAvailableIndex);
  assert.ok(majorBreakthroughIndex > gateResolvedIndex);
  assert.ok(cityEnteredIndex > majorBreakthroughIndex);

  assert.equal(eventTypes.filter((type) => type === 'progression/gate_available').length, 1);
  const firstMajorBreakthrough = probe.progressionEvents[majorBreakthroughIndex];
  assert.ok(firstMajorBreakthrough?.type === 'progression/breakthrough');
  assert.equal(firstMajorBreakthrough.payload.toRealmIndex, 1);
  const firstCityEntered = probe.progressionEvents.find((event) => event.type === 'progression/city_entered');
  assert.ok(firstCityEntered?.type === 'progression/city_entered');
  assert.equal(firstCityEntered.payload.cityId, 'city_stonecrag_town');

  assert.equal(eventTypes.includes('progression/content_cap_reached'), false);
});
