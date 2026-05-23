import assert from 'node:assert/strict';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const readRepoFile = (relativePath: string) => fs.readFile(path.resolve(process.cwd(), relativePath), 'utf8');

test('Status V2 layout keeps six compact diagnostic cards without chamber anchors', async () => {
  const statusScreen = await readRepoFile('src/components/screens/StatusScreen.tsx');

  const expectedCardTestIds = [
    'status-v2-card-current-omen',
    'status-v2-card-gate-proof',
    'status-v2-card-life-identity',
    'status-v2-card-preparation-health',
    'status-v2-card-current-work',
    'status-v2-card-recent-omens',
  ];
  expectedCardTestIds.forEach((testId) => {
    assert.equal(statusScreen.includes(testId), true, `missing V2 diagnostic card ${testId}`);
  });

  assert.equal(statusScreen.includes('className="statusV2Root"'), true);
  assert.equal(statusScreen.includes('className="statusV2Grid"'), true);
  assert.equal(statusScreen.includes('<StatusSummaryHeader'), false);
  assert.equal(statusScreen.includes('<RunCompass'), false);
  assert.equal(statusScreen.includes('className="statusChamberLayout"'), false);
  assert.equal(statusScreen.includes('className="statusChamberCorePlate"'), false);
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
