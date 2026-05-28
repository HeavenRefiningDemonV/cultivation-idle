import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';

test('gameStore tick no longer runs gate availability diagnostics directly', () => {
  const source = readFileSync('src/stores/gameStore.ts', 'utf8');
  const tickStart = source.indexOf('tick: (deltaTime: number)');
  const nextMethodStart = source.indexOf('setFocusMode:', tickStart);
  assert.ok(tickStart > 0, 'gameStore tick method should be present');
  assert.ok(nextMethodStart > tickStart, 'setFocusMode should follow tick for this source guard');

  const tickSource = source.slice(tickStart, nextMethodStart);
  assert.equal(tickSource.includes('trackGateAvailability'), false);
  assert.equal(tickSource.includes('adaptProgressionAuthoredContent'), false);
  assert.equal(tickSource.includes('getProgressionContract'), false);
});

test('progression diagnostics helper preserves content contract ownership', () => {
  const source = readFileSync('src/services/diagnostics/progressionGateAvailability.ts', 'utf8');

  assert.match(source, /getProgressionContract\(adaptProgressionAuthoredContent\(content\)\)/);
  assert.match(source, /progressionTimingTracker\.trackGateAvailability/);
  assert.equal(source.includes('trial_foundation_gate'), false);
});
