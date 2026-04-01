import assert from 'node:assert/strict';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import test from 'node:test';

async function readRepoFile(relativePath: string) {
  return fs.readFile(path.resolve(process.cwd(), relativePath), 'utf8');
}

test('center hud removes verse dead-space compensation and empty buff slab mount', async () => {
  const source = await readRepoFile('src/components/screens/CultivateScreen.tsx');
  const styles = await readRepoFile('src/components/screens/CultivateScreen.scss');

  assert.match(styles, /\.cultivationHudStack > \.progress-bar\s*\{[\s\S]*margin-bottom:\s*0/);
  assert.match(source, /\{activeCultivationBuffs\.length > 0 \? \(/);
  assert.doesNotMatch(source, /No active tonics\. Families overwrite weaker effects in the same lane\./);
});
