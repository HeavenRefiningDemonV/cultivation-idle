import assert from 'node:assert/strict';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import test from 'node:test';

async function readRepoFile(relativePath: string) {
  return fs.readFile(path.resolve(process.cwd(), relativePath), 'utf8');
}

test('cultivation mounts breakthrough and doctrine into explicit left/right side rails', async () => {
  const source = await readRepoFile('src/components/screens/CultivateScreen.tsx');
  const styles = await readRepoFile('src/components/screens/CultivateScreen.scss');

  assert.match(source, /<div className="cultivationSideRails"[\s\S]*cultivationSideRail--left[\s\S]*<CultivationBreakthroughPanel[\s\S]*cultivationSideRail--right[\s\S]*<CultivationDoctrineSummary/);
  assert.doesNotMatch(source, /className="cultivationInfoRow"/);
  assert.match(styles, /\.cultivationSideRail--left\s*\{[\s\S]*left:/);
  assert.match(styles, /\.cultivationSideRail--right\s*\{[\s\S]*right:/);
});
