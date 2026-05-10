import assert from 'node:assert/strict';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import test from 'node:test';

async function readRepoFile(relativePath: string) {
  return fs.readFile(path.resolve(process.cwd(), relativePath), 'utf8');
}

test('cultivation screen renders one explicit centerpiece shell wrapper and altar grounding layers', async () => {
  const screenSource = await readRepoFile('src/features/cultivation/exact/CultivationExactScreen.tsx');
  assert.match(screenSource, /cultivationExactHeroPlate/);
  assert.match(screenSource, /cultivationExactAltarTrim/);
  assert.match(screenSource, /cultivationExactMistMask/);
  assert.match(screenSource, /<DantianOrb/);
});

test('centerpiece shell styles include reduced-motion fallback and localized halo/mist layers', async () => {
  const styleSource = await readRepoFile('src/features/cultivation/exact/CultivationExactScreen.scss');
  assert.match(styleSource, /cultivationExactHalo/);
  assert.match(styleSource, /cultivationExactMistMask/);
  assert.match(styleSource, /data-reduced-motion="true"/);
});
