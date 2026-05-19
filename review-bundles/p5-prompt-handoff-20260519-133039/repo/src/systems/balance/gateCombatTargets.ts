export interface GateCombatWinRateEnvelope {
  belowMinimum: readonly [number, number];
  minimum: readonly [number, number];
  recommended: readonly [number, number];
}

export interface GateCombatDurationEnvelope {
  minimumMedianSec: number;
  recommendedMedianSec: number;
}

export interface GateCombatTarget {
  gateIndex: 1 | 2 | 3 | 4 | 5;
  winRate: GateCombatWinRateEnvelope;
  duration: GateCombatDurationEnvelope;
}

export const GATE_COMBAT_TARGETS: readonly GateCombatTarget[] = [
  {
    gateIndex: 1,
    winRate: {
      belowMinimum: [0.0, 0.12],
      minimum: [0.25, 0.45],
      recommended: [0.8, 0.95],
    },
    duration: {
      minimumMedianSec: 39,
      recommendedMedianSec: 27,
    },
  },
  {
    gateIndex: 2,
    winRate: {
      belowMinimum: [0.0, 0.1],
      minimum: [0.2, 0.4],
      recommended: [0.78, 0.92],
    },
    duration: {
      minimumMedianSec: 44,
      recommendedMedianSec: 31,
    },
  },
  {
    gateIndex: 3,
    winRate: {
      belowMinimum: [0.0, 0.08],
      minimum: [0.18, 0.35],
      recommended: [0.76, 0.9],
    },
    duration: {
      minimumMedianSec: 49,
      recommendedMedianSec: 35,
    },
  },
  {
    gateIndex: 4,
    winRate: {
      belowMinimum: [0.0, 0.07],
      minimum: [0.15, 0.32],
      recommended: [0.72, 0.86],
    },
    duration: {
      minimumMedianSec: 56,
      recommendedMedianSec: 41,
    },
  },
  {
    gateIndex: 5,
    winRate: {
      belowMinimum: [0.0, 0.05],
      minimum: [0.1, 0.25],
      recommended: [0.68, 0.82],
    },
    duration: {
      minimumMedianSec: 63,
      recommendedMedianSec: 49,
    },
  },
] as const;

export function getGateCombatTarget(gateIndex: number): GateCombatTarget | null {
  return GATE_COMBAT_TARGETS.find((entry) => entry.gateIndex === gateIndex) ?? null;
}
