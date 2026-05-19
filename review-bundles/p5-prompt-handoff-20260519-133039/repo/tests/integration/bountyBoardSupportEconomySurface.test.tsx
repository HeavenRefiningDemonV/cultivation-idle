import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';

import { buildSupportEconomySurfaceModelFromReadModel } from '../../src/systems/economy/supportEconomySurfaceModel.js';
import { resolveBountyDestination } from '../../src/utils/bountyRouting.js';

const PANEL_PATH = path.resolve(process.cwd(), 'src', 'components', 'screens', 'BountyBoardPanel.tsx');

test('bounty board source surfaces the support-economy summary in a bounded row', async () => {
  const source = await readFile(PANEL_PATH, 'utf8');

  assert.match(source, /Gate support reserve/);
  assert.match(source, /Merit supports fail-safe gate access\. Keep this reserve healthy\./);
  assert.match(source, /Merit .* target/);
  assert.doesNotMatch(source, /accordion|expand|Show more support diagnostics/i);
});

test('support surface model turns read-model truth into compact reserve copy', () => {
  const surface = buildSupportEconomySurfaceModelFromReadModel({
    currentCityId: 'city_pinewind_hamlet',
    currentCityIndex: 0,
    nextGateIndex: 1,
    currentMerit: '4',
    currentSpiritStones: '0',
    nextGateTrialId: 'trial_novices_clearing',
    nextGateFailSafeCost: { merit: '10', spiritStones: '0', gold: '25000' },
    meritMinimumReserveLow: '4',
    meritMinimumReserveHigh: '6',
    targetMeritReserve: '10',
    spiritStoneMinimumReserve: '0',
    spiritStoneIdealReserve: '0',
    meritReserveGap: '6',
    spiritStoneMinimumGap: '0',
    spiritStoneIdealGap: '0',
    meritReserveStatus: 'between_minimum_and_ideal',
    reserveStatus: 'between_minimum_and_ideal',
    eligibleDefeatMeritReward: '2',
    expectedMeritAfterThreeEligibleDefeats: '10',
    failSafeAffordableNow: false,
  });

  assert.match(surface.meritReserveLine, /safe band 4–6/);
  assert.match(surface.eligibleDefeatRewardLine, /\+2 Merit/);
});

test('craft support route no longer lies as Forge-only when Apothecary is the honest live route', () => {
  const destination = resolveBountyDestination({
    cityId: 'city_pinewind_hamlet',
    bountyKind: 'CRAFT_COMPLETE',
    cityModules: ['apothecary', 'forge'],
    craftRouteSupportState: {
      apothecaryBelowFloor: true,
      forgeBelowFloor: false,
      apothecaryQueueOrStockGap: true,
    },
  });

  assert.equal(destination.kind, 'module');
  assert.equal(destination.moduleKey, 'apothecary');
});
