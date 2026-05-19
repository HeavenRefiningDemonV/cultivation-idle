import assert from 'node:assert/strict';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import test from 'node:test';

async function readRepoFile(relativePath: string) {
  return fs.readFile(path.resolve(process.cwd(), relativePath), 'utf8');
}

test('cultivation mounts breakthrough and doctrine into explicit left/right side rails', async () => {
  const source = await readRepoFile('src/features/cultivation/exact/CultivationExactScreen.tsx');
  const styles = await readRepoFile('src/features/cultivation/exact/CultivationExactScreen.scss');

  assert.match(source, /className="cultivationExactMilestoneRail"[\s\S]*data-region="left-milestone-seals"/);
  assert.match(source, /className="cultivationExactDoctrineRail"[\s\S]*data-region="right-doctrine-rail"/);
  assert.match(source, /cultivationExactDaoSeal/);
  assert.doesNotMatch(source, /className="cultivationInfoRow"/);
  assert.match(styles, /\.cultivationExactMilestoneRail\s*\{[\s\S]*grid-area:\s*left/);
  assert.match(styles, /\.cultivationExactDoctrineRail\s*\{[\s\S]*grid-area:\s*right/);
});
