import assert from 'node:assert/strict';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import test from 'node:test';

async function readRepoFile(relativePath: string) {
  return fs.readFile(path.resolve(process.cwd(), relativePath), 'utf8');
}

test('verse surface is doctrine-owned and no longer mounted as a center hud slot under qi bar', async () => {
  const source = await readRepoFile('src/features/cultivation/exact/CultivationExactScreen.tsx');
  const styles = await readRepoFile('src/features/cultivation/exact/CultivationExactScreen.scss');

  assert.doesNotMatch(source, /className="cultivationVerseSlot"/);
  assert.doesNotMatch(source, /cultivationVerseSlot__bar/);
  assert.match(source, /drawer\.verse/);
  assert.match(source, /<VerseMiniBar/);
  assert.doesNotMatch(styles, /\.cultivationVerseSlot\s*\{/);
});
