import assert from 'node:assert/strict';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import test from 'node:test';

async function readRepoFile(relativePath: string) {
  return fs.readFile(path.resolve(process.cwd(), relativePath), 'utf8');
}

test('cultivation command deck uses side-seal layout with left breakthrough and right doctrine rails', async () => {
  const source = await readRepoFile('src/components/screens/CultivateScreen.tsx');
  const styles = await readRepoFile('src/components/screens/CultivateScreen.scss');

  assert.match(source, /<div className="cultivationInfoRow">[\s\S]*<CultivationBreakthroughPanel[\s\S]*cultivationInfoRow__centerSpacer[\s\S]*<CultivationDoctrineSummary/);
  assert.match(styles, /\.cultivationInfoRow\s*\{[\s\S]*grid-template-columns:\s*minmax\(260px, 360px\) minmax\(300px, 1fr\) minmax\(260px, 360px\)/);
  assert.match(styles, /\.cultivationInfoRow > \.cultivationBreakthroughPanel\s*\{[\s\S]*grid-column:\s*1/);
  assert.match(styles, /\.cultivationInfoRow > \.cultivationDoctrinePanel\s*\{[\s\S]*grid-column:\s*3/);
});
