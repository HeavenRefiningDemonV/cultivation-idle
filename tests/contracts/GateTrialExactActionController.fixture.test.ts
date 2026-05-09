import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

function sourceSlice(source: string, startToken: string, endToken: string): string {
  const start = source.indexOf(startToken);
  assert.equal(start >= 0, true, `missing slice start ${startToken}`);
  const end = source.indexOf(endToken, start + startToken.length);
  return end >= 0 ? source.slice(start, end) : source.slice(start);
}

void test('Gate Trial Exact G8 action controller exports required live action API', () => {
  const source = readFileSync('src/features/world/gateTrialExact/useGateTrialExactActionController.ts', 'utf8');

  for (const required of [
    'export interface GateTrialExactActionControllerOptions',
    'export interface GateTrialExactActionController',
    'export function useGateTrialExactActionController',
    'onPrimaryAction',
    'onSafetyNetAction',
    'onTopFixAction',
    'onTacticalCellAction',
    'onReadinessNodeAction',
  ]) {
    assert.equal(source.includes(required), true, `missing ${required}`);
  }
});

void test('Gate Trial Exact G8 attempt action starts trial directly without external combat preview', () => {
  const source = readFileSync('src/features/world/gateTrialExact/useGateTrialExactActionController.ts', 'utf8');
  const attemptSlice = sourceSlice(source, 'const startGateTrialAttempt', 'const purchaseSafetyNet');

  for (const required of [
    'getTrialLifecycleSnapshot',
    'getTrialGateRewardBundle',
    "startActivity('trial'",
    'setAutoAttack(true)',
    'setAutoCombatAI(true)',
    'startCombat(trialDef.bossId',
    "type: 'trial'",
    'countsTowardFailSafe: lifecycle.countsTowardFailSafeOnStart',
    'rewardBundle: getTrialGateRewardBundle',
  ]) {
    assert.equal(source.includes(required), true, `attempt action missing ${required}`);
  }

  for (const forbidden of [
    'openCombatPreview',
    'startCombatFromPreview',
    'window.confirm',
    'beginTrialSession',
    'setAttemptStart',
    'recordFailure',
    'markCleared',
    'markBypassed',
    'grantRewards(',
  ]) {
    assert.equal(attemptSlice.includes(forbidden), false, `attempt action must not reference ${forbidden}`);
  }
});

void test('Gate Trial Exact G8 stop action uses safe stop path and does not record failure', () => {
  const source = readFileSync('src/features/world/gateTrialExact/useGateTrialExactActionController.ts', 'utf8');
  const stopSlice = sourceSlice(source, 'const stopGateTrialAttempt', 'const breakthroughHandoff');

  assert.equal(source.includes('stopCombatAndClose'), true);
  assert.equal(source.includes('No active Gate Trial attempt to stop'), true);

  for (const forbidden of [
    'recordFailure',
    'markCleared',
    'markBypassed',
    'RewardService.grantRewards',
    'RewardService.spendCurrency',
  ]) {
    assert.equal(stopSlice.includes(forbidden), false, `stop action must not reference ${forbidden}`);
  }
});

void test('Gate Trial Exact G8 safety net action uses RewardService and markBypassed without clearing trial', () => {
  const source = readFileSync('src/features/world/gateTrialExact/useGateTrialExactActionController.ts', 'utf8');

  for (const required of [
    'purchaseSafetyNet',
    'lifecycle.failSafe.canPurchase',
    'inventory.canAffordCurrency',
    'RewardService.spendCurrency',
    'RewardService.grantRewards',
    'getTrialGateRewardBundle',
    'markBypassed(trialDef.id',
  ]) {
    assert.equal(source.includes(required), true, `safety net action missing ${required}`);
  }

  const safetySlice = sourceSlice(source, 'const purchaseSafetyNet', 'const stopGateTrialAttempt');

  for (const forbidden of [
    'markCleared',
    'recordFailure',
    'startCombat',
    'openCombatPreview',
    'startCombatFromPreview',
  ]) {
    assert.equal(safetySlice.includes(forbidden), false, `safety net action must not reference ${forbidden}`);
  }
});

void test('Gate Trial Exact G8 routes top fixes and tactical cells to existing systems only', () => {
  const source = readFileSync('src/features/world/gateTrialExact/useGateTrialExactActionController.ts', 'utf8');

  for (const required of [
    "buildingKey: 'forge'",
    "buildingKey: 'apothecary'",
    "apothecarySurface: 'pouch'",
    "buildingKey: 'ruins'",
    "buildingKey: 'bounties'",
    "buildingKey: 'expeditions'",
    "setActiveTab('techniques')",
    "setActiveTab('cultivation')",
    'closeWorldBuildingModal',
  ]) {
    assert.equal(source.includes(required), true, `routing action missing ${required}`);
  }

  const routeSlice = sourceSlice(source, 'const routeToFix', 'const handlePrimaryAction');
  for (const forbidden of [
    'useRuinsStore',
    'useOutskirtsStore',
    'RewardService',
    'startCombatFromPreview',
    'openCombatPreview',
  ]) {
    assert.equal(routeSlice.includes(forbidden), false, `routing actions must not reference ${forbidden}`);
  }
});

void test('Gate Trial Exact G8 tactical cells call the live tactical action handler from the pure screen', () => {
  const source = readFileSync('src/features/world/gateTrialExact/GateTrialExactScreen.ts', 'utf8');

  for (const required of [
    'onTacticalCellAction?: (cellId: GateTrialTacticalCellId) => void',
    "cell.id !== 'hp' && cell.id !== 'gate'",
    "const tacticalElement = canRouteTacticalCell ? 'button' : 'div'",
    "type: 'button'",
    'onClick: () => props.onTacticalCellAction?.(cell.id)',
    'onTacticalCellAction: props.onTacticalCellAction',
  ]) {
    assert.equal(source.includes(required), true, `screen tactical routing missing ${required}`);
  }

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

void test('Gate Trial Exact G8 action controller and owner guard fixture mode from real actions', () => {
  const controller = readFileSync('src/features/world/gateTrialExact/useGateTrialExactActionController.ts', 'utf8');
  const owner = readFileSync('src/features/world/gateTrialExact/GateTrialScreenOwner.tsx', 'utf8');

  assert.equal(controller.includes("surface.meta.mode === 'live'"), true);
  assert.equal(owner.includes("surface.meta.mode === 'live' ? actions : {}"), true);
  assert.equal(owner.includes('data-actions-enabled='), true);
});

void test('Gate Trial Exact G8 owner wires live actions without changing fixture default', () => {
  const source = readFileSync('src/features/world/gateTrialExact/GateTrialScreenOwner.tsx', 'utf8');

  assert.equal(source.includes('useGateTrialExactActionController'), true);
  assert.equal(source.includes('buildGateTrialExactSurfaceFromStores'), true);
  assert.equal(source.includes("props.forceFixture === false ? 'live' : 'fixture'"), true);
  assert.equal(source.includes("surface.meta.mode === 'live' ? actions : {}"), true);
  assert.equal(source.includes('<GateTrialExactScreen surface={surface}'), true);

  for (const forbidden of [
    'openCombatPreview',
    'startCombatFromPreview',
    'RewardService',
    'markBypassed',
    'markCleared',
    'recordFailure',
  ]) {
    assert.equal(source.includes(forbidden), false, `owner must not directly reference ${forbidden}`);
  }
});

void test('Gate Trial Exact G8 barrel exports action controller', () => {
  const source = readFileSync('src/features/world/gateTrialExact/index.ts', 'utf8');

  assert.equal(source.includes("./useGateTrialExactActionController.js"), true);
});

void test('Gate Trial Exact G8 keeps normal World route in live exact mode', () => {
  const openWorldModule = readFileSync('src/systems/world/openWorldModule.ts', 'utf8');
  const modal = readFileSync('src/components/modals/WorldBuildingModal.tsx', 'utf8');
  const entrySurface = readFileSync('src/systems/ui/world/worldBuildingModalEntrySurface.ts', 'utf8');

  assert.equal(openWorldModule.includes("gateTrialExactMode: 'fixture'"), false);
  assert.equal(openWorldModule.includes("gateTrialExactMode: 'live'"), true);

  assert.equal(modal.includes("storeModalIntent?.gateTrialExactMode === 'fixture'"), true);
  assert.equal(modal.includes("storeModalIntent?.gateTrialExactMode === 'live'"), false);

  assert.match(entrySurface, /case 'gateTrial':[\s\S]*backgroundVariant\s*=\s*'gate-trial-exact';[\s\S]*shellFamily\s*=\s*'gate-trial-scenic';[\s\S]*shellMode\s*=\s*'screen-owned';/);
});

void test('Gate Trial Exact G8 action controller does not import legacy UI or combat presentation components', () => {
  const source = readFileSync('src/features/world/gateTrialExact/useGateTrialExactActionController.ts', 'utf8');

  for (const forbidden of [
    'GateTrialBuildingPanel',
    'GateTrialWorldLayout',
    'GateTrialReadinessCard',
    'GateTrialChecklist',
    'GateTrialSafetyNetCard',
    'GateTrialTopFixes',
    'GateTrialAttemptCluster',
    'CombatModuleTopLane',
    'InkCombatShell',
    'InkHealthBar',
    'GameIcon',
    'lucide-react',
    'OutskirtsExact',
    'RuinsExact',
  ]) {
    assert.equal(source.includes(forbidden), false, `controller must not reference ${forbidden}`);
  }
});
