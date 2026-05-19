import assert from 'node:assert/strict';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import test from 'node:test';

async function readRepoFile(relativePath: string) {
  return fs.readFile(path.resolve(process.cwd(), relativePath), 'utf8');
}

test('cultivation final-polish surfaces keep no-shift size reservations for lotus and verse states', async () => {
  const ribbonStyles = await readRepoFile('src/ui/cultivation/CultivationHeaderRibbon.scss');
  const verseStyles = await readRepoFile('src/ui/cultivation/VerseMiniBar.scss');

  assert.match(ribbonStyles, /\.cultivationHeaderRibbonValue--qi\s*\{[\s\S]*min-height:/);
  assert.match(ribbonStyles, /\.cultivationHeaderRibbonQiText\s*\{[\s\S]*min-width:/);
  assert.match(ribbonStyles, /\.cultivationHeaderRibbonQiState\s*\{[\s\S]*min-width:/);
  assert.match(verseStyles, /\.verseMiniBar__labelText\s*\{[\s\S]*min-width:/);
  assert.match(verseStyles, /\.verseMiniBar__labelValue\s*\{[\s\S]*min-width:/);
});
