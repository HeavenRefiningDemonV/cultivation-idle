import { isTribulationPressurePreviewEnabled } from './tribulationPressureFeatureFlag.js';
import type {
  BuildTribulationPressureArgs,
  TribulationPressureReliefRoute,
  TribulationPressureSourceLine,
  TribulationPressureState,
  TribulationPressureSurfaceV1,
} from './types.js';

function clampScore(score: number): number {
  if (!Number.isFinite(score)) return 0;
  return Math.max(0, Math.min(100, Math.round(score)));
}

function stateForScore(score: number): TribulationPressureState {
  if (score >= 60) return 'fracturing';
  if (score >= 25) return 'strained';
  return 'calm';
}

function pushRoute(
  routes: TribulationPressureReliefRoute[],
  route: TribulationPressureReliefRoute,
): void {
  if (routes.some((entry) => entry.target === route.target && entry.label === route.label)) return;
  routes.push(route);
}

export function buildTribulationPressureSurface(args: BuildTribulationPressureArgs = {}): TribulationPressureSurfaceV1 {
  if (!isTribulationPressurePreviewEnabled()) {
    return {
      version: 1,
      enabled: false,
      state: 'hidden',
      pressureScore: 0,
      summaryLine: '',
      sourceLines: [],
      reliefRoutes: [],
      deterministicOutcomeLine: '',
      debugNotes: ['Tribulation pressure preview is disabled.'],
    };
  }

  const sourceLines: TribulationPressureSourceLine[] = [];
  const reliefRoutes: TribulationPressureReliefRoute[] = [];
  let score = 0;
  const stability = typeof args.stabilityPct === 'number' ? args.stabilityPct : 100;

  if (stability < 40) {
    score += 35;
    sourceLines.push({
      code: 'low_stability',
      label: 'Low stability makes the threshold feel strained.',
      severity: 'critical',
    });
    pushRoute(reliefRoutes, {
      target: 'cultivation',
      label: 'Stabilize Breath',
      reason: 'Settle Qi and stability before forcing the ritual preview.',
    });
  } else if (stability < 70) {
    score += 15;
    sourceLines.push({
      code: 'low_stability',
      label: 'Stability is not settled enough for a quiet ritual.',
      severity: 'warning',
    });
    pushRoute(reliefRoutes, {
      target: 'cultivation',
      label: 'Settle Cultivation',
      reason: 'A steadier vessel lowers the preview pressure.',
    });
  }

  if (args.rushedThreshold) {
    score += 20;
    sourceLines.push({
      code: 'rushed_threshold',
      label: 'The threshold was reached before the life posture fully settled.',
      severity: 'warning',
    });
    pushRoute(reliefRoutes, {
      target: 'gate_trial',
      label: 'Review Gate Proof',
      reason: 'Confirm the threshold proof is clean before the ritual.',
    });
  }

  if (args.heartLawMismatch) {
    score += 20;
    sourceLines.push({
      code: 'heart_law_mismatch',
      label: 'Heart Law doctrine does not cleanly match the current build pressure.',
      severity: 'warning',
    });
    pushRoute(reliefRoutes, {
      target: 'heart_law',
      label: 'Review Heart Law',
      reason: 'A matched doctrine steadies the ritual preview.',
    });
  }

  if (args.underpreparedGateClear) {
    score += 20;
    sourceLines.push({
      code: 'underprepared_gate_clear',
      label: 'The gate was cleared with strained preparation.',
      severity: 'warning',
    });
    pushRoute(reliefRoutes, {
      target: 'apothecary',
      label: 'Prepare Support',
      reason: 'Medicine support can settle a strained threshold preview.',
    });
  }

  if (args.repeatedRiskyClear) {
    score += 15;
    sourceLines.push({
      code: 'repeated_risky_clear',
      label: 'Repeated risky clears leave pressure around the ritual.',
      severity: 'warning',
    });
    pushRoute(reliefRoutes, {
      target: 'forge',
      label: 'Raise the Floor',
      reason: 'A stronger floor makes the next ritual preview quieter.',
    });
  }

  if (args.missingBreakthroughSupport) {
    score += 15;
    sourceLines.push({
      code: 'missing_breakthrough_support',
      label: 'No breakthrough support package is prepared.',
      severity: 'info',
    });
    pushRoute(reliefRoutes, {
      target: 'ruins',
      label: 'Gather Support',
      reason: 'Support materials can reduce ritual strain in a future packet.',
    });
  }

  const pressureScore = clampScore(score);
  const state = stateForScore(pressureScore);
  const summaryLine = state === 'calm'
    ? 'The vessel is quiet. No tribulation pressure gathers around this threshold.'
    : state === 'strained'
      ? 'The threshold trembles; preparation can settle the ritual preview.'
      : 'Pressure gathers around the threshold, but no random fate decides this ritual.';

  return {
    version: 1,
    enabled: true,
    state,
    pressureScore,
    summaryLine,
    sourceLines,
    reliefRoutes,
    deterministicOutcomeLine: 'Preview only: deterministic pressure readout, no random breakthrough failure and no resource loss.',
    debugNotes: [
      'Feature flag enabled explicitly for preview.',
      `score=${pressureScore}`,
      `state=${state}`,
    ],
  };
}
