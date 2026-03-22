import assert from 'node:assert/strict';
import test from 'node:test';

import {
  getAllSupportBountyClaimExpectations,
  getAllSupportReserveTargets,
} from '../../src/systems/economy/supportCurrencyTargets.js';

test('support-currency reserve targets stay locked for all five gates', () => {
  assert.deepEqual(getAllSupportReserveTargets(), [
    { gateIndex: 1, meritIdealReserve: 10, spiritStoneMinimumReserve: 0, spiritStoneIdealReserve: 0 },
    { gateIndex: 2, meritIdealReserve: 15, spiritStoneMinimumReserve: 3, spiritStoneIdealReserve: 5 },
    { gateIndex: 3, meritIdealReserve: 20, spiritStoneMinimumReserve: 8, spiritStoneIdealReserve: 15 },
    { gateIndex: 4, meritIdealReserve: 25, spiritStoneMinimumReserve: 20, spiritStoneIdealReserve: 40 },
    { gateIndex: 5, meritIdealReserve: 35, spiritStoneMinimumReserve: 50, spiritStoneIdealReserve: 100 },
  ]);
});

test('support bounty claim expectations exist for each city phase', () => {
  assert.deepEqual(getAllSupportBountyClaimExpectations(), [
    { cityPhase: 'pinewind', cityIndex: 0, minClaims: 1, maxClaims: 2 },
    { cityPhase: 'stonecrag', cityIndex: 1, minClaims: 2, maxClaims: 2 },
    { cityPhase: 'spirit_cavern', cityIndex: 2, minClaims: 2, maxClaims: 3 },
    { cityPhase: 'lotusford', cityIndex: 3, minClaims: 3, maxClaims: 3 },
    { cityPhase: 'ironpeak', cityIndex: 4, minClaims: 3, maxClaims: 4 },
  ]);
});
