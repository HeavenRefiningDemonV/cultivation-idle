import { GameEvents } from '../../../src/services/events/GameEvents.js';
import { createBalanceTelemetryHarness } from './createBalanceTelemetryHarness.js';

export function runBalanceTelemetryProbe() {
  const harness = createBalanceTelemetryHarness();
  const now = Date.now();
  GameEvents.emit({ type: 'progression/life_started', payload: { timestamp: now, runStartTime: now - 5000, elapsedMsSinceLifeStart: 5000, trigger: 'fresh_start', lifeOrdinal: 1, sessionKind: 'first_life' } });
  GameEvents.emit({ type: 'rewards/spent', payload: { costs: { gold: '100' }, reason: 'alchemy_queue:test_recipe' } });
  return harness;
}
