import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import test from 'node:test';

function read(relPath: string): string {
  return readFileSync(resolve(process.cwd(), relPath), 'utf8');
}

test('forge exact action controller delegates starts and claims to ProfessionStore actions', () => {
  const source = read('src/features/professions/forgeExact/useForgeExactActionController.ts');

  assert.match(source, /useProfessionStore\.getState\(\)\.startForgeJob\(/);
  assert.match(source, /useProfessionStore\.getState\(\)\.claimForgeJob\(/);
  assert.match(source, /toForgeJobMode\(requestedMode\)/);
  assert.match(source, /openWorldModule\(\{ cityId, moduleKey \}\)/);
  assert.doesNotMatch(source, /nav-tab|setActiveTab|closeWorldBuildingModal/);
});

test('forge exact render path does not import direct reward, inventory, or equipment mutation services', () => {
  const renderSource = read('src/features/professions/forgeExact/ForgeExactScreen.tsx');
  const controllerSource = read('src/features/professions/forgeExact/useForgeExactActionController.ts');

  assert.doesNotMatch(renderSource, /useInventoryStore|useEquipmentStore|RewardService|applyRefineService|applyTemperService/);
  assert.doesNotMatch(controllerSource, /RewardService|applyRefineService|applyTemperService|spendItem|spendCurrency|applyRefineFromForge|applyTemperAffix/);
});
