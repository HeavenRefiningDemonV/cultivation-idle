import { evaluateEconomicShortfalls } from '../../../src/systems/economy/economicShortfallEvaluator.js';
import { buildEconomicRecommendationEngine } from '../../../src/systems/economy/economicRecommendationEngine.js';
import { buildPrepRecoveryWindowReport } from '../../../src/systems/economy/prepRecoveryWindowReadModel.js';
import type { ValidatedContent } from '../../../src/content/index.js';
import type { PrepRecoveryScenarioKind } from '../../../src/systems/balance/prepEconomyTargets.js';
import { createPrepRecoveryScenario } from './createPrepRecoveryScenario.js';

export function runPrepRecoveryProbe(content: ValidatedContent, gateIndex: number, kind: PrepRecoveryScenarioKind) {
  const snapshot = createPrepRecoveryScenario(content, gateIndex, kind);
  const shortfalls = evaluateEconomicShortfalls(snapshot);
  const engine = buildEconomicRecommendationEngine(snapshot);
  const report = buildPrepRecoveryWindowReport(snapshot, kind);
  return {
    snapshot,
    initialShortfalls: shortfalls.shortfalls,
    recommendations: engine,
    report,
  };
}
