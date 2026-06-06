import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { buildRuinsExactSurfaceFromStores } from '../../src/features/world/ruinsExact/buildRuinsExactSurface.js';

void test('live binding source uses dropsPerRoom pool and final chest guaranteed', () => {
  const source = readFileSync('src/features/world/ruinsExact/buildRuinsExactSurface.ts', 'utf8');
  assert.equal(source.includes('dropsPerRoom?.pool'), true);
  assert.equal(source.includes('finalChestDrops?.guaranteed'), true);
  assert.equal(source.includes('bossChestRareFailures'), true);
  assert.equal(source.includes('autoRepeatDefault'), true);
});

void test('exact owner/action controller quarantine old ruins components', () => {
  const owner = readFileSync('src/features/world/ruinsExact/RuinsScreenOwner.tsx', 'utf8');
  const controller = readFileSync('src/features/world/ruinsExact/useRuinsExactActionController.ts', 'utf8');
  for (const forbidden of ['RuinsCtaZone', 'RuinsProgress', 'RuinsSummaryCard', 'deriveRuinsActionState', 'CombatModuleTopLane']) {
    assert.equal(owner.includes(forbidden) || controller.includes(forbidden), false);
  }
  assert.equal(controller.includes('setAutoRepeat'), true);
  assert.equal(controller.includes("apothecarySurface: 'pouch'"), true);
});

void test('live primary action intent is coherent', () => {
  const surface = buildRuinsExactSurfaceFromStores('city_pinewind_hamlet');
  assert.equal(['enter-ruins', 'continue-exploration', 'disabled'].includes(surface.primaryAction.intent), true);
});
