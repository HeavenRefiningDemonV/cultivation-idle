import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';

import { buildSupportEconomySurfaceModelFromReadModel } from '../../src/systems/economy/supportEconomySurfaceModel.js';

const PANEL_PATH = path.resolve(process.cwd(), 'src', 'components', 'screens', 'world', 'buildings', 'GateTrialBuildingPanel.tsx');

test('gate trial panel source surfaces reserve costs, reserve gaps, and eligible defeat reward text', async () => {
  const source = await readFile(PANEL_PATH, 'utf8');

  assert.match(source, /GateTrialSafetyNetCard/);
  assert.match(source, /Safety Net/);
  assert.match(source, /Eligible Defeats/);
});

test('support surface model exposes the bounded reserve gap copy needed by the gate panel', () => {
  const surface = buildSupportEconomySurfaceModelFromReadModel({
    currentCityId: 'city_stonecrag_town',
    currentCityIndex: 1,
    nextGateIndex: 2,
    currentMerit: '5',
    currentSpiritStones: '1',
    nextGateTrialId: 'trial_foundation_ascent',
    nextGateFailSafeCost: { merit: '15', spiritStones: '3', gold: '80000' },
    meritMinimumReserveLow: '6',
    meritMinimumReserveHigh: '8',
    targetMeritReserve: '15',
    spiritStoneMinimumReserve: '3',
    spiritStoneIdealReserve: '5',
    meritReserveGap: '10',
    spiritStoneMinimumGap: '2',
    spiritStoneIdealGap: '4',
    meritReserveStatus: 'below_minimum',
    reserveStatus: 'below_minimum',
    eligibleDefeatMeritReward: '3',
    expectedMeritAfterThreeEligibleDefeats: '14',
    failSafeAffordableNow: false,
  });

  assert.match(surface.failSafeLine, /15 Merit and 3 Spirit Stones/);
  assert.match(surface.reserveGapLine, /10 Merit to target and 2 Spirit Stones to minimum/);
  assert.match(surface.eligibleDefeatRewardLine, /\+3 Merit/);
});
