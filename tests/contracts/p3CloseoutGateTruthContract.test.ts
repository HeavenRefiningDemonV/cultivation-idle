import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { buildForgeFloorReadModel } from '../../src/systems/forge/index.js';

function read(relPath: string): string {
  return readFileSync(resolve(process.cwd(), relPath), 'utf8');
}

test('Forge floor read model can be driven by current gate context instead of selected city index', () => {
  const model = buildForgeFloorReadModel({
    weaponRefineFloor: 1,
    accessoryRefineFloor: 1,
    temperSuccessesBySlot: { weapon: 0, accessory: 0 },
    inventoryRuneCounts: {},
    socketedRuneIds: [],
    cityIndex: 0,
    currentGateIndex: 3,
    gateLabel: 'Core Formation Gate',
    gateContextSource: 'progression-contract',
  });

  assert.equal(model.nextGateRecommendation?.gateIndex, 3);
  assert.equal(model.nextGateRecommendation?.gateLabel, 'Core Formation Gate');
  assert.equal(model.nextGateRecommendation?.source, 'progression-contract');
  assert.equal(model.nextGateRecommendation?.weaponRefine, 7);
});

test('live Forge and Techniques surfaces do not hardcode Foundation Gate as current target', () => {
  const forge = read('src/features/professions/forgeExact/buildForgeExactSurface.ts');
  const techniques = read('src/features/techniquesExact/buildTechniquesExactSurface.ts');
  const liveTechniquesDiagnosis = techniques.slice(
    techniques.indexOf('function buildDiagnosisChips'),
    techniques.indexOf('function buildInspector'),
  );

  assert.doesNotMatch(forge, /Reason: Foundation Gate weapon floor/u);
  assert.doesNotMatch(liveTechniquesDiagnosis, /value:\s*'Foundation Gate'/u);
});
