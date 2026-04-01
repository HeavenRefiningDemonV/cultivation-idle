import assert from 'node:assert/strict';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import test from 'node:test';

async function readRepoFile(relativePath: string) {
  return fs.readFile(path.resolve(process.cwd(), relativePath), 'utf8');
}

test('cultivation verse slot is mounted directly beneath the qi progress bar in the hud stack', async () => {
  const source = await readRepoFile('src/components/screens/CultivateScreen.tsx');
  const styles = await readRepoFile('src/components/screens/CultivateScreen.scss');

  assert.match(source, /<QiProgressBar[\s\S]*?<div className="cultivationVerseSlot"/);
  assert.match(source, /className="cultivationVerseSlot__bar"/);
  assert.match(styles, /\.cultivationVerseSlot\s*\{[\s\S]*min-height:/);
  assert.match(styles, /\.cultivationHudStack > \.progress-bar\s*\{[\s\S]*margin-bottom:\s*0/);
});
