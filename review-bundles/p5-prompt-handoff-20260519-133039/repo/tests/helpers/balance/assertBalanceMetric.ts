import assert from 'node:assert/strict';

export function assertBalanceMetric(metricId: string, condition: boolean, detail?: string) {
  assert.equal(condition, true, `[balance-regression:${metricId}] ${detail ?? 'expected metric to pass'}`);
}
