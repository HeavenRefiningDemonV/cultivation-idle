import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

function read(path: string): string {
  return readFileSync(path, 'utf8');
}

const MODULE_SCREENS = [
  'src/features/apothecary/exact/ApothecaryExactScreen.tsx',
  'src/features/professions/forgeExact/ForgeExactScreen.tsx',
  'src/features/world/manualPavilionExact/ManualPavilionExactScreen.tsx',
  'src/features/techniquesExact/TechniquesExactScreen.tsx',
  'src/features/pavilion/PavilionExactScreen.tsx',
  'src/features/world/bountiesExact/BountiesExactScreen.tsx',
  'src/features/world/expeditionsExact/ExpeditionsExactScreen.tsx',
];

test('module decommission target prefers local purpose panels over public Module Source-Sink UI', () => {
  const agents = read('AGENTS.md');
  const releasePlan = read('docs/release/status_v3_dao_decommission_plan.md');
  const targetDocs = `${agents}\n${releasePlan}`;

  for (const label of [
    'Forge Floor',
    'Healing Reserve',
    'Doctrine Stock',
    'Bounty Board',
    'Expedition Support',
    'Item Ledger',
  ]) {
    assert.match(targetDocs, new RegExp(label), `Packet A docs should reserve local panel label ${label}.`);
  }

  assert.match(targetDocs, /ModuleSourceSinkPanel|Module Source-Sink/i);
  assert.match(targetDocs, /must not render|forbidden|decommission/i);
});

test('legacy module source/sink projection remains internal compatibility infrastructure', () => {
  const projection = read('src/systems/ui/daoMandate/daoMandateModuleProjection.ts');
  const sharedPanel = read('src/ui/daoMandate/ModuleSourceSinkPanel.tsx');

  assert.match(projection, /buildLiveDaoMandateModuleSourceSinkProjection/);
  assert.match(sharedPanel, /ModuleSourceSinkPanel/);

  for (const source of [projection, sharedPanel]) {
    assert.doesNotMatch(source, /RewardService|grantRewards|spendCurrency|startCombat|recordFailure|resetPrestige/);
  }
});

test('Packet D exact module screens remove public ModuleSourceSinkPanel and projection fields', () => {
  for (const path of MODULE_SCREENS) {
    const source = read(path);
    assert.doesNotMatch(source, /ModuleSourceSinkPanel|mandateSourceSink|buildLiveDaoMandateModuleSourceSinkProjection/, `${path} must use a local purpose panel.`);
  }

  for (const path of [
    'src/features/apothecary/exact/apothecaryExactTypes.ts',
    'src/features/professions/forgeExact/forgeExactTypes.ts',
    'src/features/world/manualPavilionExact/manualPavilionExactTypes.ts',
    'src/features/techniquesExact/techniquesExactTypes.ts',
    'src/features/pavilion/pavilionTypes.ts',
    'src/features/world/bountiesExact/bountiesExactTypes.ts',
    'src/features/world/expeditionsExact/expeditionsExactTypes.ts',
  ]) {
    assert.doesNotMatch(read(path), /mandateSourceSink|DaoMandateModuleSourceSinkProjection/, `${path} must not expose public source/sink projection data.`);
  }
});
