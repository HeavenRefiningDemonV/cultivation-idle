import assert from 'node:assert/strict';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const readRepoFile = (relativePath: string) => fs.readFile(path.resolve(process.cwd(), relativePath), 'utf8');

test('Status layout renders the public Status Ledger without chamber or V2 diagnostic anchors', async () => {
  const [statusScreen, statusLedgerPage, statusLedgerHero, statusMetricStrip] = await Promise.all([
    readRepoFile('src/components/screens/StatusScreen.tsx'),
    readRepoFile('src/ui/status/ledger/StatusLedgerPage.tsx'),
    readRepoFile('src/ui/status/ledger/StatusLedgerHero.tsx'),
    readRepoFile('src/ui/status/ledger/StatusMetricStrip.tsx'),
  ]);
  const statusLedgerSources = `${statusLedgerPage}\n${statusLedgerHero}\n${statusMetricStrip}`;

  assert.equal(statusScreen.includes('StatusLedgerPage'), true);
  assert.equal(statusScreen.includes('surface.statusLedger'), true);
  assert.equal(statusScreen.includes('statusV2'), false);

  const expectedLedgerTestIds = [
    'status-ledger-root',
    'status-ledger-hero',
    'status-ledger-metrics',
    'status-ledger-grid',
    'status-ledger-card-milestone',
    'status-ledger-card-cultivation-base',
    'status-ledger-card-mission-requirements',
    'status-ledger-card-best-improvements',
    'status-ledger-card-safety-net',
    'status-ledger-card-identity-doctrine',
    'status-ledger-card-current-work',
    'status-ledger-card-build-preparation',
  ];
  expectedLedgerTestIds.forEach((testId) => {
    assert.equal(statusLedgerSources.includes(testId), true, `missing Status Ledger anchor ${testId}`);
  });

  for (const forbidden of [
    'status-v2-card-current-omen',
    'status-v2-card-gate-proof',
    'status-v2-card-preparation-health',
    'status-v2-card-recent-omens',
    'className="statusV2Root"',
    'className="statusV2Grid"',
    '<StatusSummaryHeader',
    '<RunCompass',
    'className="statusChamberLayout"',
    'className="statusChamberCorePlate"',
  ]) {
    assert.equal(`${statusScreen}\n${statusLedgerSources}`.includes(forbidden), false, `public Status layout must not include ${forbidden}`);
  }
});

test('status baseline styles avoid no-shift violations in hover/focus interaction states', async () => {
  const [statusStyles, runCompassStyles] = await Promise.all([
    readRepoFile('src/components/screens/StatusScreen.scss'),
    readRepoFile('src/ui/status/RunCompass.scss'),
  ]);

  const riskyStatePattern = /(:hover|:focus-visible)\s*\{[^}]*\b(width|height|padding|margin|top|left|right|bottom|font-size)\b/;
  assert.equal(riskyStatePattern.test(statusStyles), false);
  assert.equal(riskyStatePattern.test(runCompassStyles), false);
});

test('world map label styles avoid no-shift violations in hover/focus interaction states', async () => {
  const [cityMapHubStyles, scenicLabelStyles] = await Promise.all([
    readRepoFile('src/components/screens/CityMapHub.scss'),
    readRepoFile('src/ui/shell/ScenicLabel.scss'),
  ]);

  const riskyStatePattern = /(:hover|:focus-visible)\s*\{[^}]*\b(width|height|padding|margin|top|left|right|bottom|font-size|min-inline-size|min-block-size)\b/;
  assert.equal(riskyStatePattern.test(cityMapHubStyles), false);
  assert.equal(riskyStatePattern.test(scenicLabelStyles), false);
});
