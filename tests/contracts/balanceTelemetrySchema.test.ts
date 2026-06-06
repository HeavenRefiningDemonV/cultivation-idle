import assert from 'node:assert/strict';
import test from 'node:test';
import { existsSync, readFileSync } from 'node:fs';

import {
  BALANCE_TELEMETRY_KINDS,
  ECONOMY_SINK_KINDS,
  ECONOMY_SOURCE_KINDS,
} from '../../src/services/diagnostics/balanceTelemetrySchema.js';
import { useTelemetryStore } from '../../src/stores/telemetryStore.js';

test('balance telemetry schema exposes required kinds and taxonomies', () => {
  assert.ok(BALANCE_TELEMETRY_KINDS.includes('progression/life_started'));
  assert.ok(BALANCE_TELEMETRY_KINDS.includes('trials/attempt_resolved'));
  assert.ok(BALANCE_TELEMETRY_KINDS.includes('offline/applied'));
  assert.ok(BALANCE_TELEMETRY_KINDS.includes('training/started'));
  assert.ok(BALANCE_TELEMETRY_KINDS.includes('training/grade_changed'));
  assert.ok(BALANCE_TELEMETRY_KINDS.includes('training/cap_hit'));
  assert.ok(BALANCE_TELEMETRY_KINDS.includes('training/offline_applied'));
  assert.ok(BALANCE_TELEMETRY_KINDS.includes('dao_heart/started'));
  assert.ok(BALANCE_TELEMETRY_KINDS.includes('dao_heart/level_changed'));
  assert.ok(BALANCE_TELEMETRY_KINDS.includes('dao_heart/offline_applied'));
  assert.ok(BALANCE_TELEMETRY_KINDS.includes('breakthrough/attempted'));
  assert.ok(BALANCE_TELEMETRY_KINDS.includes('prestige/started'));
  assert.ok(BALANCE_TELEMETRY_KINDS.includes('prestige/memory_applied'));
  assert.ok(BALANCE_TELEMETRY_KINDS.includes('prestige/reset_bucket_applied'));
  assert.ok(ECONOMY_SOURCE_KINDS.includes('eligible_defeat_merit'));
  assert.ok(ECONOMY_SINK_KINDS.includes('gate_fail_safe_purchase'));
});

test('telemetry store keeps raw and balance channels separate', () => {
  const state = useTelemetryStore.getState();
  assert.ok(Array.isArray(state.events));
  assert.ok(Array.isArray(state.balanceEvents));
  assert.equal(typeof state.addEvent, 'function');
  assert.equal(typeof state.addBalanceEvent, 'function');
});

test('balance schema has single truth owner in diagnostics schema file', () => {
  assert.equal(existsSync('src/services/diagnostics/balanceTelemetrySchema.ts'), true);
  const contents = readFileSync('src/services/diagnostics/balanceTelemetrySchema.ts', 'utf8');
  assert.ok(contents.includes('BALANCE_TELEMETRY_SCHEMA_VERSION'));
});
