import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

test('P3 read surfaces stay out of reward and combat ownership', () => {
  const files = [
    'src/systems/world/cityPhaseSurface.ts',
    'src/systems/world/moduleRoleBannerSurface.ts',
    'src/systems/economy/resourceProvenanceSurface.ts',
    'src/systems/economy/gatePrepPackageSurface.ts',
    'src/features/apothecary/exact/apothecaryPrepSurface.ts',
    'src/systems/forge/forgeFloorSurface.ts',
    'src/features/world/manualPavilionExact/manualOfferFitSurface.ts',
    'src/features/techniquesExact/techniqueGateFitSurface.ts',
    'src/features/world/ruinsExact/ruinsReliefSurface.ts',
    'src/features/world/bountiesExact/bountyRouteSurface.ts',
    'src/features/world/expeditionsExact/expeditionShortageSurface.ts',
  ];

  for (const file of files) {
    const source = readFileSync(file, 'utf8');
    assert.doesNotMatch(source, /grantRewards|addItem|addCurrency|resolveCombat|resolveFight|CombatStore/);
    assert.doesNotMatch(source, /useInventoryStore\.setState|useGameStore\.setState|useTrialStore\.setState/);
  }
});
