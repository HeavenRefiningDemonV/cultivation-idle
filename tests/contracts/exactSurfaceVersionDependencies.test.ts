import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const ownerExpectations: Array<{ file: string; tokens: string[] }> = [
  {
    file: 'src/features/world/gateTrialExact/GateTrialScreenOwner.tsx',
    tokens: [
      'inventoryVersion',
      'currencyVersion',
      'trialProgressVersion',
      'pouchVersion',
      'equipmentVersion',
      'bountyVersion',
      'expeditionVersion',
      'combatSessionVersion',
      'combatViewVersion',
      'combatResultVersion',
    ],
  },
  {
    file: 'src/features/apothecary/exact/ApothecaryExactScreenOwner.tsx',
    tokens: ['inventoryVersion', 'currencyVersion', 'shopVersion', 'pouchVersion', 'professionVersion', 'bountyVersion'],
  },
  {
    file: 'src/features/professions/forgeExact/ForgeExactScreenOwner.tsx',
    tokens: ['inventoryVersion', 'currencyVersion', 'professionVersion', 'equipmentVersion'],
  },
  {
    file: 'src/features/world/manualPavilionExact/ManualPavilionScreenOwner.tsx',
    tokens: ['stockVersion', 'inventoryVersion', 'currencyVersion', 'collectionVersion', 'masteryVersion'],
  },
  {
    file: 'src/features/world/bountiesExact/BountiesExactScreenOwner.tsx',
    tokens: ['boardVersion', 'currencyVersion'],
  },
  {
    file: 'src/features/world/expeditionsExact/ExpeditionsExactScreenOwner.tsx',
    tokens: ['expeditionVersion', 'bountyVersion'],
  },
  {
    file: 'src/features/pavilion/PavilionScreenOwner.tsx',
    tokens: ['pouchVersion', 'equipmentVersion'],
  },
  {
    file: 'src/features/cultivation/exact/CultivationExactScreenOwner.tsx',
    tokens: ['contentVersion', 'inventoryVersion', 'prestigeSnapshot', 'runCompassActionKey'],
  },
];

describe('exact surface version dependencies', () => {
  for (const expectation of ownerExpectations) {
    it(`${expectation.file} keys live surfaces with scalar invalidation inputs`, () => {
      const source = readFileSync(join(process.cwd(), expectation.file), 'utf8');

      assert.equal(source.includes('JSON.stringify'), false);
      for (const token of expectation.tokens) {
        assert.ok(source.includes(token), `${expectation.file} should include ${token}`);
      }
    });
  }
});
