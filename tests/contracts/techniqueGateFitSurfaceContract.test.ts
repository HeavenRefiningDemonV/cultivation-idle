import assert from 'node:assert/strict';
import test from 'node:test';

import { buildTechniqueGateFitSurface } from '../../src/features/techniquesExact/techniqueGateFitSurface.js';
import { getValidatedEconomicContent } from '../helpers/economy/setupEconomicRuntimeScenario.js';

test('TechniqueGateFitSurfaceV1 explains slot, archetype, and AI posture gaps', async () => {
  const content = await getValidatedEconomicContent();
  const surface = buildTechniqueGateFitSurface({
    content,
    pathId: 'heaven',
    equippedTechniqueIds: [],
    ownedTechniqueIds: [],
    aiProfile: 'burst',
    recentDefeatCode: 'underprepared',
    masteryByTechniqueId: {},
    rankByTechniqueId: {},
    runeCountByTechniqueId: {},
  });

  assert.equal(surface.version, 1);
  assert.equal(surface.archetype?.pathId, 'heaven');
  assert.ok(surface.rows.some((row) => row.group === 'slot' && row.state === 'missing'));
  assert.ok(surface.rows.some((row) => row.group === 'ai'));
  assert.ok(surface.recommendedActions.some((action) => /AI|profile|loadout|Manual Pavilion/i.test(action.label)));
});
