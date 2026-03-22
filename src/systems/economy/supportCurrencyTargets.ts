export type SupportReserveGateIndex = 1 | 2 | 3 | 4 | 5;
export type SupportCityPhaseKey = 'pinewind' | 'stonecrag' | 'spirit_cavern' | 'lotusford' | 'ironpeak';

export interface SupportReserveTargets {
  gateIndex: SupportReserveGateIndex;
  meritIdealReserve: number;
  spiritStoneMinimumReserve: number;
  spiritStoneIdealReserve: number;
}

export interface SupportBountyClaimExpectation {
  cityPhase: SupportCityPhaseKey;
  cityIndex: number;
  minClaims: number;
  maxClaims: number;
}

const SUPPORT_RESERVE_TARGETS: Record<SupportReserveGateIndex, SupportReserveTargets> = {
  1: { gateIndex: 1, meritIdealReserve: 10, spiritStoneMinimumReserve: 0, spiritStoneIdealReserve: 0 },
  2: { gateIndex: 2, meritIdealReserve: 15, spiritStoneMinimumReserve: 3, spiritStoneIdealReserve: 5 },
  3: { gateIndex: 3, meritIdealReserve: 20, spiritStoneMinimumReserve: 8, spiritStoneIdealReserve: 15 },
  4: { gateIndex: 4, meritIdealReserve: 25, spiritStoneMinimumReserve: 20, spiritStoneIdealReserve: 40 },
  5: { gateIndex: 5, meritIdealReserve: 35, spiritStoneMinimumReserve: 50, spiritStoneIdealReserve: 100 },
};

const SUPPORT_BOUNTY_CLAIM_EXPECTATIONS: Record<SupportCityPhaseKey, SupportBountyClaimExpectation> = {
  pinewind: { cityPhase: 'pinewind', cityIndex: 0, minClaims: 1, maxClaims: 2 },
  stonecrag: { cityPhase: 'stonecrag', cityIndex: 1, minClaims: 2, maxClaims: 2 },
  spirit_cavern: { cityPhase: 'spirit_cavern', cityIndex: 2, minClaims: 2, maxClaims: 3 },
  lotusford: { cityPhase: 'lotusford', cityIndex: 3, minClaims: 3, maxClaims: 3 },
  ironpeak: { cityPhase: 'ironpeak', cityIndex: 4, minClaims: 3, maxClaims: 4 },
};

export function clampSupportReserveGateIndex(value: number): SupportReserveGateIndex {
  const normalized = Math.max(1, Math.min(5, Math.floor(value || 1)));
  return normalized as SupportReserveGateIndex;
}

export function getSupportReserveTargetsByGateIndex(gateIndex: number): SupportReserveTargets {
  return SUPPORT_RESERVE_TARGETS[clampSupportReserveGateIndex(gateIndex)];
}

export function getSupportReserveTargetsByCityIndex(cityIndex: number): SupportReserveTargets {
  return getSupportReserveTargetsByGateIndex(cityIndex + 1);
}

export function getSupportBountyClaimExpectationByCityIndex(cityIndex: number): SupportBountyClaimExpectation {
  const match = Object.values(SUPPORT_BOUNTY_CLAIM_EXPECTATIONS).find((entry) => entry.cityIndex === cityIndex);
  return match ?? SUPPORT_BOUNTY_CLAIM_EXPECTATIONS.ironpeak;
}

export function getAllSupportReserveTargets(): SupportReserveTargets[] {
  return Object.values(SUPPORT_RESERVE_TARGETS);
}

export function getAllSupportBountyClaimExpectations(): SupportBountyClaimExpectation[] {
  return Object.values(SUPPORT_BOUNTY_CLAIM_EXPECTATIONS);
}
