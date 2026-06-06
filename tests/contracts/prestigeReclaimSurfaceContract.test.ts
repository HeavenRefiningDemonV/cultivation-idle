import assert from 'node:assert/strict';
import test from 'node:test';

import {
  buildPathTrainingMemoryKey,
  createPrestigeMemoryRecord,
  resolvePrestigeReclaimState,
} from '../../src/systems/prestige/prestigeMemoryResolver.js';
import { buildReclaimMemorySurface } from '../../src/features/prestigeReclaim/buildReclaimMemorySurface.js';

test('Prestige Reclaim surface exposes active rows, inspector truth, route comparison, and no claim action', () => {
  const record = createPrestigeMemoryRecord({
    domain: 'path_training',
    componentKey: buildPathTrainingMemoryKey({
      pathId: 'heaven',
      statId: 'qi_control',
      regimenId: 'still_star_breathing',
      realmBand: 'realm_0',
    }),
    priorBest: { realmIndex: 0, rating: 42 },
    lastLifeId: 'life-1',
    reclaimRank: 1,
  });
  const resolved = resolvePrestigeReclaimState({
    records: [record],
    reclaimRank: 1,
    current: {
      lifeId: 'life-2',
      realmIndex: 0,
      path: {
        pathId: 'heaven',
        statId: 'qi_control',
        regimenId: 'still_star_breathing',
        realmBand: 'realm_0',
        currentRating: 12,
        currentRealmCap: 60,
      },
      composite: {
        pathId: 'heaven',
        heartLawId: null,
        rootKey: null,
        gateChainId: null,
      },
    },
  });

  const surface = buildReclaimMemorySurface({
    resolved,
    currentRouteLabel: 'Heaven / no Heart Law / no root / no gate chain',
  });

  assert.equal(surface.rootTestId, 'prestige-reclaim-memory-panel');
  assert.equal(surface.summary.activeCount, 1);
  assert.equal(surface.rows[0]?.state, 'active');
  assert.match(surface.rows[0]?.stateLabel ?? '', /Active Reclaim Memory/i);
  assert.match(surface.rows[0]?.inspector.mechanicalEffectLabel ?? '', /1\.45x/i);
  assert.match(surface.rows[0]?.stopConditionLabel ?? '', /rating 42/i);
  assert.equal(surface.rows[0]?.actions.some((action) => /claim/i.test(action.label)), false);
  assert.equal(surface.accessibility.noHoverOnlyTruth, true);
  assert.equal(surface.accessibility.nonColorStateText, true);
  assert.equal(surface.accessibility.reducedMotionPreservesMeaning, true);
});
