import assert from 'node:assert/strict';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const readRepoFile = (relativePath: string) => fs.readFile(path.resolve(process.cwd(), relativePath), 'utf8');

test('status troubleshooting layout keeps six-card composition with chamber hierarchy anchors', async () => {
  const statusScreen = await readRepoFile('src/components/screens/StatusScreen.tsx');

  const expectedCards = ['Identity', 'Readiness', 'Permanent Floor', 'Preparation', 'Build', 'Safety Net'];
  expectedCards.forEach((cardTitle) => {
    assert.equal(statusScreen.includes(`title="${cardTitle}"`), true, `missing diagnostic card ${cardTitle}`);
  });

  assert.equal(statusScreen.includes('<StatusSummaryHeader'), true);
  assert.equal(statusScreen.includes('<RunCompass'), true);
  assert.equal(statusScreen.includes('className="statusChamberLayout"'), true);
  assert.equal(statusScreen.includes('className="statusChamberCorePlate"'), true);
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
