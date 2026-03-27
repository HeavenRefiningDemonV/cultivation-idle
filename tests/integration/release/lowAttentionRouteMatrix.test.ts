import assert from 'node:assert/strict';
import test from 'node:test';

import {
  assertAlternativeRouteCommonInvariants,
  assertLowAttentionBudget,
} from '../../helpers/release/alternativeRouteAssertions.js';
import { runLowAttentionAlternativeRoute } from '../../helpers/release/runAlternativeRoute.js';

test('low-attention route remains bounded and alert/recommendation-driven', async () => {
  const result = await runLowAttentionAlternativeRoute();

  assertAlternativeRouteCommonInvariants(result);
  assertLowAttentionBudget(result, 6);

  assert.equal(result.failures.length, 0, result.failures.map((entry) => `${entry.code}: ${entry.message}`).join(' | '));
  assert.equal(result.interactionLog.length > 0, true);

  const alertDriven = result.interactionLog.filter((entry) => entry.triggeredBy === 'alert').length;
  assert.equal(alertDriven >= 1, true);

  const diagnosisRow = result.comparisonRows.find((row) => row.metric === 'section5_has_consistent_diagnosis');
  assert.ok(diagnosisRow);
  assert.equal(diagnosisRow?.routeValue, true);
});
