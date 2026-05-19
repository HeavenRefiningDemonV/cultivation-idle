import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

test('Outskirts, Ruins, and Gate Trial exact surfaces expose optional typed aftermath fields', () => {
  const outskirtsTypes = readFileSync('src/features/world/outskirts/types.ts', 'utf8');
  const ruinsTypes = readFileSync('src/features/world/ruinsExact/types.ts', 'utf8');
  const gateTypes = readFileSync('src/features/world/gateTrialExact/gateTrialExactTypes.ts', 'utf8');

  for (const [label, source] of [
    ['Outskirts', outskirtsTypes],
    ['Ruins', ruinsTypes],
    ['Gate Trial', gateTypes],
  ] as const) {
    assert.equal(source.includes("from '../../../features/combatAftermath/index.js'") || source.includes("from '../../combatAftermath/index.js'"), true, `${label} surface must import aftermath type`);
    assert.equal(source.includes('aftermath?: CombatAftermathSurfaceV1 | null'), true, `${label} surface missing aftermath`);
  }
});

test('pure exact screens render the shared aftermath card in reserved page-owned slots', () => {
  const outskirtsScreen = readFileSync('src/features/world/outskirts/OutskirtsExactMockupScreen.ts', 'utf8');
  const ruinsScreen = readFileSync('src/features/world/ruinsExact/RuinsExactMockupScreen.ts', 'utf8');
  const gateScreen = readFileSync('src/features/world/gateTrialExact/GateTrialExactScreen.ts', 'utf8');

  for (const [label, source, testId] of [
    ['Outskirts', outskirtsScreen, 'outskirts-aftermath-slot'],
    ['Ruins', ruinsScreen, 'ruins-aftermath-slot'],
    ['Gate Trial', gateScreen, 'gate-trial-aftermath-slot'],
  ] as const) {
    assert.equal(source.includes('CombatAftermathCard'), true, `${label} screen must render CombatAftermathCard`);
    assert.equal(source.includes(testId), true, `${label} screen must reserve aftermath slot ${testId}`);
    assert.equal(source.includes('useCombatStore'), false, `${label} screen must stay pure`);
    assert.equal(source.includes('RewardService'), false, `${label} screen must stay pure`);
  }
});

test('owners handle aftermath route callbacks rather than routing inside the card', () => {
  const card = readFileSync('src/features/combatAftermath/CombatAftermathCard.tsx', 'utf8');
  const outskirtsOwner = readFileSync('src/features/world/outskirts/OutskirtsScreenOwner.tsx', 'utf8');
  const ruinsOwner = readFileSync('src/features/world/ruinsExact/RuinsScreenOwner.tsx', 'utf8');
  const gateOwner = readFileSync('src/features/world/gateTrialExact/GateTrialScreenOwner.tsx', 'utf8');

  assert.equal(card.includes('useUIStore'), false);
  assert.equal(card.includes('useCombatStore'), false);
  assert.equal(card.includes('RewardService'), false);
  assert.equal(card.includes('onRoute'), true);

  for (const [label, source] of [
    ['Outskirts', outskirtsOwner],
    ['Ruins', ruinsOwner],
    ['Gate Trial', gateOwner],
  ] as const) {
    assert.equal(source.includes('routeCombatAftermathTarget'), true, `${label} owner must handle route callbacks`);
    assert.equal(source.includes('onAftermathRoute'), true, `${label} owner must pass route callback`);
  }
});
