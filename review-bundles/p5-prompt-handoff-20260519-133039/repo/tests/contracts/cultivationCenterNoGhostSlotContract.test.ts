import assert from 'node:assert/strict';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import test from 'node:test';

async function readRepoFile(relativePath: string) {
  return fs.readFile(path.resolve(process.cwd(), relativePath), 'utf8');
}

test('center hud removes verse dead-space compensation and empty buff slab mount', async () => {
  const source = await readRepoFile('src/features/cultivation/exact/CultivationExactScreen.tsx');
  const styles = await readRepoFile('src/features/cultivation/exact/CultivationExactScreen.scss');

  assert.match(source, /cultivationExactRitualStack/);
  assert.match(styles, /\.cultivationExactRitualStack\s*\{[\s\S]*top:\s*var\(--cult-exact-ritual-top\)/);
  assert.doesNotMatch(styles, /\.cultivationExactQiRail\s*\{[\s\S]*grid-area:\s*qi/);
  assert.match(source, /drawer\.rows\.map/);
  assert.doesNotMatch(source, /No active tonics\. Families overwrite weaker effects in the same lane\./);
  assert.doesNotMatch(source, /cultivationInfoRow__centerSpacer/);
});
