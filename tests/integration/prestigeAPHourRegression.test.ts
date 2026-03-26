import assert from 'node:assert/strict';
import test from 'node:test';

import { PRESTIGE_TARGETS } from '../../src/systems/balance/prestigeTargets.js';
import { runPrestigeApHourProbe } from '../helpers/balance/runPrestigeApHourProbe.js';

test('packet 6.7c AP/hour checkpoints satisfy progression floors without shallow-loop dominance', async () => {
  const probe = await runPrestigeApHourProbe();
  const byId = Object.fromEntries(probe.rows.map((row) => [row.checkpointId, row]));

  assert.ok(byId.core_entry.apGain >= PRESTIGE_TARGETS.checkpointApTargets.core_entry.minAp);
  assert.ok(byId.core_entry.apGain <= PRESTIGE_TARGETS.checkpointApTargets.core_entry.maxAp);
  assert.ok(byId.nascent_entry.apGain >= PRESTIGE_TARGETS.checkpointApTargets.nascent_entry.minAp);
  assert.ok(byId.nascent_entry.apGain <= PRESTIGE_TARGETS.checkpointApTargets.nascent_entry.maxAp);
  assert.ok(byId.soul_entry.apGain >= PRESTIGE_TARGETS.checkpointApTargets.soul_entry.minAp);
  assert.ok(byId.soul_entry.apGain <= PRESTIGE_TARGETS.checkpointApTargets.soul_entry.maxAp);
  assert.ok(byId.spirit_severing_entry.apGain >= PRESTIGE_TARGETS.checkpointApTargets.spirit_severing_entry.minAp);
  assert.ok(byId.spirit_severing_entry.apGain <= PRESTIGE_TARGETS.checkpointApTargets.spirit_severing_entry.maxAp);

  assert.ok(byId.core_entry.apPerHour >= PRESTIGE_TARGETS.apPerHourPolicy.coreFormationApPerHourFloor);
  assert.ok(byId.nascent_entry.apPerHour >= byId.core_entry.apPerHour * PRESTIGE_TARGETS.apPerHourPolicy.nascentVsCoreMultiplierFloor);
  assert.ok(byId.soul_entry.apPerHour >= byId.nascent_entry.apPerHour * PRESTIGE_TARGETS.apPerHourPolicy.soulVsNascentMultiplierFloor);
  assert.ok(byId.spirit_severing_entry.apPerHour >= byId.soul_entry.apPerHour * PRESTIGE_TARGETS.apPerHourPolicy.capVsSoulMultiplierFloor);

  assert.ok(byId.spirit_severing_entry.apPerHour > byId.core_entry.apPerHour);
  assert.ok(probe.rows.every((row) => row.passes));
});
