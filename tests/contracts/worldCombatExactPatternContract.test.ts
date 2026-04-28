import assert from 'node:assert/strict';
import fs from 'node:fs';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import {
  WORLD_COMBAT_EXACT_PATTERN_REGISTRY,
  getWorldCombatExactPattern,
  listWorldCombatExactPatterns,
} from '../../src/features/world/combatExactPattern/worldCombatExactPattern.js';

void test('C10 Test A: registry contains exactly outskirts/gateTrial/ruins', () => {
  assert.deepEqual(Object.keys(WORLD_COMBAT_EXACT_PATTERN_REGISTRY).sort(), ['gateTrial', 'outskirts', 'ruins']);
  assert.equal(listWorldCombatExactPatterns().length, 3);
  assert.equal(getWorldCombatExactPattern('outskirts').moduleKey, 'outskirts');
  assert.equal(getWorldCombatExactPattern('gateTrial').moduleKey, 'gateTrial');
  assert.equal(getWorldCombatExactPattern('ruins').moduleKey, 'ruins');
});

void test('C10 Test B/C: ownership statuses and future owner plans are explicit', () => {
  const registry = WORLD_COMBAT_EXACT_PATTERN_REGISTRY;
  assert.equal(registry.outskirts.currentOwnershipStatus, 'exact-owner-complete');
  assert.equal(registry.outskirts.currentShellMode, 'screen-owned');
  assert.equal(registry.outskirts.futureShellMode, 'screen-owned');
  assert.match(registry.outskirts.currentOwnerFile, /OutskirtsScreenOwner/);
  assert.equal(registry.outskirts.currentRootTestId, 'outskirts-exact-page');

  assert.equal(registry.gateTrial.currentOwnershipStatus, 'legacy-preserved-for-future-cutover');
  assert.equal(registry.ruins.currentOwnershipStatus, 'legacy-preserved-for-future-cutover');

  assert.equal(registry.gateTrial.futureOwnerName, 'GateTrialScreenOwner');
  assert.equal(registry.gateTrial.futureExactScreenName, 'GateTrialExactScreen');
  assert.equal(registry.gateTrial.futureRootTestId, 'gate-trial-exact-page');
  assert.equal(registry.ruins.futureOwnerName, 'RuinsScreenOwner');
  assert.equal(registry.ruins.futureExactScreenName, 'RuinsExactScreen');
  assert.equal(registry.ruins.futureRootTestId, 'ruins-exact-page');

  for (const missing of [
    'src/features/world/gateTrial/GateTrialScreenOwner.tsx',
    'src/features/world/gateTrial/GateTrialExactScreen.ts',
    'src/features/world/ruins/RuinsScreenOwner.tsx',
    'src/features/world/ruins/RuinsExactScreen.ts',
  ]) {
    assert.equal(fs.existsSync(missing), false);
  }
});

void test('C10 Test D: shared layer contract exists and registry source is pure non-rendering', async () => {
  for (const pattern of listWorldCombatExactPatterns()) {
    assert.deepEqual(pattern.exactTheaterLayerIds, ['background', 'hp', 'actors', 'effects', 'chips', 'log', 'result']);
  }

  const source = await readFile('src/features/world/combatExactPattern/worldCombatExactPattern.ts', 'utf8');
  for (const forbidden of ['React', 'react', 'createElement', 'useState', 'useEffect', 'useMemo', 'useActivityStore', 'useCombatStore', 'useContentStore', 'useUIStore', '.scss', '.css']) {
    assert.equal(source.includes(forbidden), false);
  }
});

void test('C10 Test E/F: module visual identities are distinct and borrowing rules are explicit', () => {
  const { outskirts, gateTrial, ruins } = WORLD_COMBAT_EXACT_PATTERN_REGISTRY;
  assert.equal(outskirts.visualIdentity.sceneMood, 'open-field');
  assert.equal(gateTrial.visualIdentity.sceneMood, 'ritual-threshold');
  assert.equal(ruins.visualIdentity.sceneMood, 'sealed-ruin');
  assert.equal(outskirts.visualIdentity.informationDensity, 'light');
  assert.equal(gateTrial.visualIdentity.informationDensity, 'focused');
  assert.equal(ruins.visualIdentity.informationDensity, 'medium');

  assert.match(outskirts.visualIdentity.visualSummary.toLowerCase(), /broad/);
  assert.match(outskirts.visualIdentity.visualSummary.toLowerCase(), /field/);
  assert.match(outskirts.visualIdentity.visualSummary.toLowerCase(), /hunt/);
  assert.match(gateTrial.visualIdentity.visualSummary.toLowerCase(), /threshold/);
  assert.match(gateTrial.visualIdentity.visualSummary.toLowerCase(), /readiness/);
  assert.match(gateTrial.visualIdentity.visualSummary.toLowerCase(), /fail-safe/);
  assert.match(ruins.visualIdentity.visualSummary.toLowerCase(), /chamber/);
  assert.match(ruins.visualIdentity.visualSummary.toLowerCase(), /targeted materials/);
  assert.match(ruins.visualIdentity.visualSummary.toLowerCase(), /pity/);

  assert.equal(gateTrial.visualIdentity.forbiddenVisualBorrowing.some((line) => /Outskirts Expected Rewards/i.test(line)), true);
  assert.equal(gateTrial.visualIdentity.forbiddenVisualBorrowing.some((line) => /Outskirts encounter chain/i.test(line)), true);
  assert.equal(gateTrial.visualIdentity.forbiddenVisualBorrowing.some((line) => /wolf/i.test(line)), true);
  assert.equal(gateTrial.visualIdentity.forbiddenVisualBorrowing.some((line) => /field hunting/i.test(line)), true);

  assert.equal(ruins.visualIdentity.forbiddenVisualBorrowing.some((line) => /Outskirts Expected Rewards/i.test(line)), true);
  assert.equal(ruins.visualIdentity.forbiddenVisualBorrowing.some((line) => /Gate Trial minimum\/recommended checklist/i.test(line)), true);
  assert.equal(ruins.visualIdentity.forbiddenVisualBorrowing.some((line) => /wolf/i.test(line)), true);
  assert.equal(ruins.visualIdentity.forbiddenVisualBorrowing.some((line) => /single boss threshold/i.test(line)), true);
});

void test('C10 Test G/H/I/J: runtime ownership unchanged and no premature Gate/Ruins exact rendering ids', async () => {
  const modalEntry = await readFile('src/systems/ui/world/worldBuildingModalEntrySurface.ts', 'utf8');
  assert.match(modalEntry, /case 'outskirts':[\s\S]*backgroundVariant = 'outskirts-exact'/);
  assert.match(modalEntry, /case 'outskirts':[\s\S]*shellFamily = 'outskirts-scenic'/);
  assert.match(modalEntry, /case 'outskirts':[\s\S]*shellMode = 'screen-owned'/);
  assert.match(modalEntry, /case 'gateTrial':[\s\S]*backgroundVariant = 'inside-dungeon'/);
  assert.match(modalEntry, /case 'gateTrial':[\s\S]*shellFamily = 'combat-path'/);
  assert.match(modalEntry, /case 'gateTrial':[\s\S]*shellMode = 'close-only'/);
  assert.match(modalEntry, /case 'ruins':[\s\S]*backgroundVariant = 'inside-dungeon'/);
  assert.match(modalEntry, /case 'ruins':[\s\S]*shellFamily = 'combat-path'/);
  assert.match(modalEntry, /case 'ruins':[\s\S]*shellMode = 'close-only'/);

  for (const existsPath of [
    'src/components/screens/world/buildings/GateTrialBuildingPanel.tsx',
    'src/components/screens/world/buildings/RuinsBuildingPanel.tsx',
    'src/ui/combat/InkCombatShell.tsx',
    'src/ui/combat/InkHealthBar.tsx',
    'src/ui/world/combat/CombatModuleTopLane.tsx',
    'src/components/screens/world/buildings/CombatStyles.scss',
    'src/ui/trials/GateTrialWorldLayout.tsx',
    'src/features/ruins/ui/RuinsProgress.tsx',
    'src/ui/world/RuinsSummaryCard.tsx',
  ]) {
    assert.equal(fs.existsSync(existsPath), true);
  }

  const gatePanel = await readFile('src/components/screens/world/buildings/GateTrialBuildingPanel.tsx', 'utf8');
  const ruinsPanel = await readFile('src/components/screens/world/buildings/RuinsBuildingPanel.tsx', 'utf8');
  for (const source of [gatePanel, ruinsPanel]) {
    for (const forbidden of [
      'features/world/outskirts',
      'OutskirtsExactMockupScreen',
      'OutskirtsScreenOwner',
      'OutskirtsCombatTheater',
      'OutskirtsCombatHealthBars',
      'OutskirtsCombatActors',
      'OutskirtsCombatFloatingHits',
      'OutskirtsCombatLogSlip',
      'OutskirtsCombatChips',
      'OutskirtsCombatResultOverlay',
      'OutskirtsActiveChainBadge',
      'outskirtsExactPage',
      'outskirtsCombatTheater',
      'gate-trial-exact-page',
      'gate-trial-combat-theater',
      'gate-trial-combat-result-overlay',
      'ruins-exact-page',
      'ruins-combat-theater',
      'ruins-combat-result-overlay',
    ]) {
      assert.equal(source.includes(forbidden), false);
    }
  }
});

void test('C10 Test K/L: README and future packet sequences are explicit', async () => {
  const readme = await readFile('src/features/world/combatExactPattern/README.md', 'utf8');
  assert.equal(readme.includes('The shared pattern is ownership and active-state grammar, not identical visual layout.'), true);
  assert.equal(readme.includes('Gate Trial and Ruins remain legacy-preserved until their own future packet series performs a module-specific cutover.'), true);
  assert.equal(readme.includes('Outskirts: open-field'), true);
  assert.equal(readme.includes('Gate Trial: ritual-threshold'), true);
  assert.equal(readme.includes('Ruins: sealed-ruin'), true);
  assert.equal(readme.includes('C10 does not migrate Gate Trial.'), true);
  assert.equal(readme.includes('C10 does not migrate Ruins.'), true);
  assert.equal(readme.includes('C10 does not refactor Outskirts.'), true);

  const gate = WORLD_COMBAT_EXACT_PATTERN_REGISTRY.gateTrial.futurePacketSequence.join(' ');
  const ruins = WORLD_COMBAT_EXACT_PATTERN_REGISTRY.ruins.futurePacketSequence.join(' ');
  assert.equal(WORLD_COMBAT_EXACT_PATTERN_REGISTRY.gateTrial.futurePacketSequence.length >= 9, true);
  assert.equal(WORLD_COMBAT_EXACT_PATTERN_REGISTRY.ruins.futurePacketSequence.length >= 9, true);
  for (const token of ['G0', 'G1', 'G2', 'G3', 'G4', 'G5', 'G6', 'G7', 'G8', 'G9']) assert.equal(gate.includes(token), true);
  for (const token of ['R0', 'R1', 'R2', 'R3', 'R4', 'R5', 'R6', 'R7', 'R8', 'R9']) assert.equal(ruins.includes(token), true);
});
