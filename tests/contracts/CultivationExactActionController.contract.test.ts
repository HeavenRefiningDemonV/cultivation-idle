import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

void test('Cultivation Exact action controller routes gameplay through existing owning systems', () => {
  const source = readFileSync('src/features/cultivation/exact/useCultivationExactActionController.ts', 'utf8');

  for (const required of [
    "startActivity('meditate', undefined, 'cultivation-exact-start')",
    "stopActivity('cultivation-exact-stop')",
    'game.breakthrough()',
    'window.setTimeout',
    '2000',
    'performRunCompassAction(action)',
    'performActionIfAvailable(action)',
    'openGateTrial',
    'onRitualRoute',
    "setActiveTab('prestige')",
  ]) {
    assert.equal(source.includes(required), true, `missing action controller contract ${required}`);
  }

  for (const forbidden of [
    'RewardService',
    'grantRewards',
    'useCombatStore',
    'collectCommandOmenRoutes',
    'projection.currentOmen.allowDirectRoute',
    'surface.mandateLens?.surface',
    'mandate.primaryRoute',
    'backgroundPlan.routes',
    'requirementLedger.hardGates',
    'requirementLedger.readinessFloors',
    'requirementLedger.supportReserves',
    'requirementLedger.sourceRoutes',
    '.setState({ qi',
    '.setState({ items',
    'performPrestigeReset',
    'startCombat',
  ]) {
    assert.equal(source.includes(forbidden), false, `controller must not bypass systems with ${forbidden}`);
  }
});
