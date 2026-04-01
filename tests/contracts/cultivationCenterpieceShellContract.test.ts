import assert from 'node:assert/strict';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import test from 'node:test';

async function readRepoFile(relativePath: string) {
  return fs.readFile(path.resolve(process.cwd(), relativePath), 'utf8');
}

test('cultivation screen renders one explicit centerpiece shell wrapper and altar grounding layers', async () => {
  const screenSource = await readRepoFile('src/components/screens/CultivateScreen.tsx');
  assert.match(screenSource, /cultivationCenterpieceShell/);
  assert.match(screenSource, /cultivationCenterpieceShell__altarBase/);
  assert.match(screenSource, /<DantianOrb/);
});

test('centerpiece shell styles include reduced-motion fallback and localized halo/mist layers', async () => {
  const styleSource = await readRepoFile('src/components/screens/CultivateScreen.scss');
  assert.match(styleSource, /cultivationCenterpieceShell__halo/);
  assert.match(styleSource, /cultivationCenterpieceShell__mist/);
  assert.match(styleSource, /@media \(prefers-reduced-motion: reduce\)/);
});
