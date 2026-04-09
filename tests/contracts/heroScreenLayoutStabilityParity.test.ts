import assert from 'node:assert/strict';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const readRepoFile = (relativePath: string) => fs.readFile(path.resolve(process.cwd(), relativePath), 'utf8');

test('hero-screen interaction states avoid no-shift geometry mutations in touched style surfaces', async () => {
  const [cultivateStyles, statusStyles, runCompassStyles, cultivationRibbonStyles, statusRibbonStyles] = await Promise.all([
    readRepoFile('src/components/screens/CultivateScreen.scss'),
    readRepoFile('src/components/screens/StatusScreen.scss'),
    readRepoFile('src/ui/status/RunCompass.scss'),
    readRepoFile('src/ui/cultivation/CultivationHeaderRibbon.scss'),
    readRepoFile('src/ui/status/StatusSummaryHeader.scss'),
  ]);

  const riskyStatePattern = /(:hover|:focus-visible)\s*\{[^}]*\b(width|height|padding|margin|top|left|right|bottom|font-size)\b/;
  assert.equal(riskyStatePattern.test(cultivateStyles), false);
  assert.equal(riskyStatePattern.test(statusStyles), false);
  assert.equal(riskyStatePattern.test(runCompassStyles), false);
  assert.equal(riskyStatePattern.test(cultivationRibbonStyles), false);
  assert.equal(riskyStatePattern.test(statusRibbonStyles), false);
});
