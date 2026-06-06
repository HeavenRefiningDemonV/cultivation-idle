import type { BreakthroughRiskCauseRow } from '../../content/types.js';
import type { BreakthroughStabilityInput } from './breakthroughStabilityResolver.js';
import { resolveBreakthroughStabilitySnapshot } from './breakthroughStabilityResolver.js';

export function buildBreakthroughCauseRowsStub(): BreakthroughRiskCauseRow[] {
  return [];
}

export function buildBreakthroughCauseRows(input: BreakthroughStabilityInput): BreakthroughRiskCauseRow[] {
  return resolveBreakthroughStabilitySnapshot(input).rows;
}
