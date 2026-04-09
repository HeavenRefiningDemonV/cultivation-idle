import assert from 'node:assert/strict';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const readRepoFile = (relativePath: string) => fs.readFile(path.resolve(process.cwd(), relativePath), 'utf8');

test('Cultivation screen keeps key truth surfaces in DOM components, not FX scene text', async () => {
  const screen = await readRepoFile('src/components/screens/CultivateScreen.tsx');
  const fxScene = await readRepoFile('src/ui/fx/scenes/CultivationFxScene.tsx');

  assert.match(screen, /<QiProgressBar/);
  assert.match(screen, /<VerseMiniBar/);
  assert.match(screen, /<CultivationBreakthroughPanel/);
  assert.doesNotMatch(fxScene, /Qi:\s*\{|Breakthrough|Verse|Path|Heart Law|button|aria-label=/);
});
