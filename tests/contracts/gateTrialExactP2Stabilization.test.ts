import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

function sourceSlice(source: string, startToken: string, endToken: string): string {
  const start = source.indexOf(startToken);
  assert.equal(start >= 0, true, `missing slice start ${startToken}`);
  const end = source.indexOf(endToken, start + startToken.length);
  return end >= 0 ? source.slice(start, end) : source.slice(start);
}

test('Gate Trial P2 surface carries aftermath and real support-run mapping fields', () => {
  const types = readFileSync('src/features/world/gateTrialExact/gateTrialExactTypes.ts', 'utf8');
  const builder = readFileSync('src/features/world/gateTrialExact/buildGateTrialExactSurface.ts', 'utf8');

  assert.equal(types.includes('aftermath?: CombatAftermathSurfaceV1 | null'), true);
  assert.equal(types.includes('supportRun'), true);
  assert.equal(builder.includes('buildLiveCombatAftermathSurface'), true);
  assert.equal(builder.includes('useRuinsStore'), true);
  assert.equal(builder.includes('lastRunSummary'), true);
  assert.match(builder, /lastRunSummary\?\.ruinId\s*===\s*ruinId/);
  assert.match(builder, /resolveModuleRef\(city,\s*'ruins'\)/);
  assert.doesNotMatch(builder, /support progress is unavailable/i);
});

test('Gate Trial P2 stop attempt remains single-dispatch and cannot record defeat', () => {
  const source = readFileSync('src/features/world/gateTrialExact/useGateTrialExactActionController.ts', 'utf8');
  const stopSlice = sourceSlice(source, 'const stopGateTrialAttempt', 'const breakthroughHandoff');
  const stopCalls = stopSlice.match(/stopCombatAndClose\(/g) ?? [];

  assert.equal(stopCalls.length, 1);
  for (const forbidden of [
    'recordFailure',
    'markCleared',
    'markBypassed',
    'RewardService.grantRewards',
    'RewardService.spendCurrency',
    'exitCombat()',
  ]) {
    assert.equal(stopSlice.includes(forbidden), false, `stop action must not reference ${forbidden}`);
  }
});

test('Gate Trial P2 safety net remains exactly one spend, one grant, one bypass', () => {
  const source = readFileSync('src/features/world/gateTrialExact/useGateTrialExactActionController.ts', 'utf8');
  const safetySlice = sourceSlice(source, 'const purchaseSafetyNet', 'const stopGateTrialAttempt');

  assert.equal((safetySlice.match(/RewardService\.spendCurrency/g) ?? []).length, 1);
  assert.equal((safetySlice.match(/RewardService\.grantRewards/g) ?? []).length, 1);
  assert.equal((safetySlice.match(/markBypassed/g) ?? []).length, 1);
  assert.equal(safetySlice.includes('inventory.addItem'), false);
  assert.equal(safetySlice.includes('inventory.spendCurrency'), false);
  assert.equal(safetySlice.includes('openCombatPreview'), false);
});

test('Gate Trial P2 pure screen renders aftermath without store reads or external preview', () => {
  const source = readFileSync('src/features/world/gateTrialExact/GateTrialExactScreen.ts', 'utf8');

  assert.equal(source.includes('CombatAftermathCard'), true);
  assert.equal(source.includes('gate-trial-aftermath-slot'), true);

  for (const forbidden of [
    'useCombatStore',
    'useActivityStore',
    'useUIStore',
    'openCombatPreview',
    'startCombatFromPreview',
    'RewardService',
  ]) {
    assert.equal(source.includes(forbidden), false, `screen must stay pure and not reference ${forbidden}`);
  }
});
