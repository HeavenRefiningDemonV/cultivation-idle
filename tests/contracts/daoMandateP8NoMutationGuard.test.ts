import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';

const PURE_RENDER_ROOTS = [
  'src/ui/daoMandate',
  'src/features/world/gateTrialExact/GateTrialExactScreen.ts',
  'src/features/techniquesExact/TechniquesExactScreen.tsx',
  'src/components/modals/OfflineProgressModal.tsx',
  'src/components/modals/LifeSummaryModal.tsx',
];

const FORBIDDEN_MUTATION = /RewardService|grantRewards?\(|addItem\(|removeItem\(|spendCurrency\(|recordFailure\(|recordClear\(|markCleared\(|markBypassed\(|startCombat\(|resolveCombat\(|performPrestigeReset\(|resetForPrestige\(|unlockCity\(|setState\(/;

function walk(path: string): string[] {
  const stats = statSync(path);
  if (stats.isFile()) return /\.(ts|tsx)$/.test(path) ? [path] : [];
  return readdirSync(path).flatMap((entry) => walk(join(path, entry)));
}

test('P8 Dao Mandate render surfaces do not mutate gameplay owners', () => {
  const offenders: string[] = [];
  for (const filePath of PURE_RENDER_ROOTS.flatMap(walk)) {
    const source = readFileSync(filePath, 'utf8');
    if (FORBIDDEN_MUTATION.test(source)) offenders.push(filePath.replace(/\\/g, '/'));
  }

  assert.deepEqual(offenders, []);
});
