import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const repoRoot = process.cwd();
const daoUiRoot = path.join(repoRoot, 'src', 'ui', 'daoMandate');

function readDaoFile(fileName: string): string {
  return readFileSync(path.join(daoUiRoot, fileName), 'utf8');
}

function readDaoFilesRecursive(dir = daoUiRoot): Array<{ filePath: string; text: string }> {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = path.join(dir, entry.name);
    if (entry.isDirectory()) return readDaoFilesRecursive(entryPath);
    if (!/\.(?:ts|tsx|scss)$/.test(entry.name)) return [];
    return [{ filePath: entryPath, text: readFileSync(entryPath, 'utf8') }];
  });
}

test('DaoMandateRouteButton keeps stable disabled reason slot and unique aria ids', () => {
  const source = readDaoFile('DaoMandateRouteButton.tsx');

  assert.match(source, /getDaoRouteReasonElementId/);
  assert.match(source, /aria-describedby=\{viewModel\.reason \? reasonId : undefined\}/);
  assert.match(source, /daoMandateRouteButton__reason--empty/);
  assert.match(source, /aria-hidden=\{!viewModel\.reason \? true : undefined\}/);
  assert.match(source, /data-route-kind=\{viewModel\.kind\}/);
  assert.doesNotMatch(source, /owner not wired/i);
});

test('DaoMandateRouteButton CSS reserves reason line without removing focus affordances', () => {
  const source = readDaoFile('DaoMandateRouteButton.scss');

  assert.match(source, /\.daoMandateRouteButton__reason/);
  assert.match(source, /min-height:\s*var\(--dao-route-reason-min-height\)/);
  assert.match(source, /\.daoMandateRouteButton__reason--empty/);
  assert.match(source, /visibility:\s*hidden/);
  assert.match(source, /:focus-visible/);
  assert.doesNotMatch(source, /outline:\s*none/);
});

test('Dao Mandate reduced motion source disables route hover transform and stamp motion', () => {
  const combinedSource = [
    readDaoFile('DaoMandateTokens.scss'),
    readDaoFile('DaoMandateRouteButton.scss'),
    readDaoFile('DaoMandateStatusSeal.scss'),
  ].join('\n');

  assert.match(combinedSource, /\.daoMandateMotion--reduced\s+\.daoMandateRouteButton:hover:not\(:disabled\)/);
  assert.match(combinedSource, /\[data-dao-motion='reduced'\]\s+\.daoMandateRouteButton:hover:not\(:disabled\)/);
  assert.match(combinedSource, /transform:\s*none/);
  assert.match(combinedSource, /\.daoMandateStatusSeal--animated/);
  assert.match(combinedSource, /animation:\s*none/);
});

test('Dao Mandate ledger rows reserve action width for route state changes', () => {
  const source = readDaoFile('RequirementLedger.scss');

  assert.match(source, /--dao-row-action-width/);
  assert.match(source, /\.daoRequirementLedgerRow__action/);
  assert.match(source, /min-width:\s*var\(--dao-row-action-width\)/);
  assert.match(source, /\.daoRequirementLedgerRow__reservedAction/);
});

test('Dao Mandate UI SCSS keeps focus tokens and avoids removing outlines', () => {
  const combinedSource = readDaoFilesRecursive()
    .filter(({ filePath }) => filePath.endsWith('.scss'))
    .map(({ text }) => text)
    .join('\n');

  assert.match(combinedSource, /--dao-focus-ring/);
  assert.match(combinedSource, /:focus-visible/);
  assert.doesNotMatch(combinedSource, /outline:\s*none/);
});

test('Dao Mandate UI components remain pure renderers without store or gameplay imports', () => {
  const forbiddenPatterns = [
    /from ['"][^'"]*stores/i,
    /RewardService|grantRewards|startCombat|recordFailure|markCleared|performPrestigeReset/,
    /CombatStore|TrialStore|GameStore|ActivityStore|PrestigeResetService/,
    /inventoryStore|prestigeStore/i,
    /daoMandateRouteAdapter/,
    /use[A-Z][A-Za-z0-9]*Store|getState\(|setState\(/,
  ];

  for (const { filePath, text } of readDaoFilesRecursive()) {
    for (const pattern of forbiddenPatterns) {
      assert.doesNotMatch(text, pattern, `${path.relative(repoRoot, filePath)} should not match ${pattern}`);
    }
  }
});
