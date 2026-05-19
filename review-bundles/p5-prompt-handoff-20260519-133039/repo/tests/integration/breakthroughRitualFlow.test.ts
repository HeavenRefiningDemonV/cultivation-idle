import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

function sourceSlice(source: string, startToken: string, endToken: string): string {
  const start = source.indexOf(startToken);
  assert.equal(start >= 0, true, `missing slice start ${startToken}`);
  const end = source.indexOf(endToken, start + startToken.length);
  return end >= 0 ? source.slice(start, end) : source.slice(start);
}

test('GameStore emits rich breakthrough_completed event only after successful breakthrough path', () => {
  const source = readFileSync('src/stores/gameStore.ts', 'utf8');
  const breakthroughSlice = sourceSlice(source, 'breakthrough: () => {', 'calculateQiPerSecond: () =>');

  assert.equal(breakthroughSlice.includes("type: 'progression/breakthrough_completed'"), true);
  assert.equal(breakthroughSlice.includes('gateItemIdSpent'), true);
  assert.equal(breakthroughSlice.includes('cityUnlockedIds'), true);
  assert.equal(breakthroughSlice.includes('statSnapshotBefore'), true);
  assert.equal(breakthroughSlice.includes('statSnapshotAfter'), true);
  assert.equal(breakthroughSlice.includes('method'), true);

  const beforeFirstFailureReturn = breakthroughSlice.slice(0, breakthroughSlice.indexOf('// Check breakthrough gate proof when advancing realms'));
  assert.equal(beforeFirstFailureReturn.includes("progression/breakthrough_completed"), false);
});

test('Cultivation controller opens ritual preview/result without duplicate breakthrough call', () => {
  const source = readFileSync('src/features/cultivation/exact/useCultivationExactActionController.ts', 'utf8');
  const breakThroughSlice = sourceSlice(source, 'const breakThrough = useCallback', 'const openGateTrial');

  assert.equal(breakThroughSlice.includes('buildLiveBreakthroughRitualPreviewSurface'), true);
  assert.equal(breakThroughSlice.includes('buildLiveBreakthroughRitualResultSurface'), true);
  assert.equal(breakThroughSlice.includes("GameEvents.on('progression/breakthrough_completed'"), true);
  assert.equal((breakThroughSlice.match(/game\.breakthrough\(\)/g) ?? []).length, 1);
  assert.equal(breakThroughSlice.includes('setRitualSurface'), true);
});

test('Cultivation owner renders ritual overlay and defers perk modal until closed', () => {
  const owner = readFileSync('src/features/cultivation/exact/CultivationExactScreenOwner.tsx', 'utf8');
  const overlay = readFileSync('src/features/cultivation/exact/BreakthroughRitualOverlay.tsx', 'utf8');

  assert.equal(owner.includes('BreakthroughRitualOverlay'), true);
  assert.equal(owner.includes('actions.ritualSurface ?'), true);
  assert.equal(owner.includes('!actions.ritualSurface && showPerkSelectionModal'), true);
  assert.equal(overlay.includes('proofItemSpent'), true);
  assert.equal(overlay.includes('unlockCascade'), true);
  assert.equal(overlay.includes('doctrineEcho'), true);
  assert.equal(overlay.includes('lifeMemoryLine'), true);
  assert.equal(overlay.includes('dangerouslySetInnerHTML'), false);
});
