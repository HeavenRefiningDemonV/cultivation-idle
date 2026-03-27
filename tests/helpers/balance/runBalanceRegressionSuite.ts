export interface BalanceRegressionCheck {
  metricId: string;
  run: () => void | Promise<void>;
}

export async function runBalanceRegressionSuite(checks: readonly BalanceRegressionCheck[]) {
  for (const check of checks) {
    await check.run();
  }
}
