import assert from 'node:assert/strict';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import test from 'node:test';

async function readRepoFile(relativePath: string) {
  return fs.readFile(path.resolve(process.cwd(), relativePath), 'utf8');
}

test('cultivation action lane reserves stable slots for chips, support copy, and button widths', async () => {
  const styles = await readRepoFile('src/components/screens/CultivateScreen.scss');

  assert.match(styles, /cultivationActionStateChips/);
  assert.match(styles, /\.cultivationActionButton\s*\{[\s\S]*min-inline-size:/);
  assert.match(styles, /\.cultivationBreakthroughHint\s*\{[\s\S]*min-height:/);
  assert.match(styles, /\.cultivationActionStack\s*\{[\s\S]*min-height:/);
});
