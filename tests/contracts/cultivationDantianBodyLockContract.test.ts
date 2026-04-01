import assert from 'node:assert/strict';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import test from 'node:test';

async function readRepoFile(relativePath: string) {
  return fs.readFile(path.resolve(process.cwd(), relativePath), 'utf8');
}

test('dantian orb is body-locked to a cultivator figure anchor instead of qi-bar alignment', async () => {
  const screenSource = await readRepoFile('src/components/screens/CultivateScreen.tsx');
  const screenStyles = await readRepoFile('src/components/screens/CultivateScreen.scss');
  const orbStyles = await readRepoFile('src/ui/cultivation/DantianOrb.scss');

  assert.match(screenSource, /className="cultivationHeroFigure"[\s\S]*className="cultivationHeroFigure__dantianAnchor"[\s\S]*<DantianOrb/);
  assert.match(screenStyles, /--dantian-anchor-x:/);
  assert.match(screenStyles, /--dantian-anchor-y:/);
  assert.match(screenStyles, /\.cultivationHeroFigure__dantianAnchor\s*\{[\s\S]*left:\s*var\(--dantian-anchor-x\)[\s\S]*top:\s*var\(--dantian-anchor-y\)/);
  assert.doesNotMatch(screenStyles, /\.cultivationSceneLayer \.dantianOrb\s*\{[\s\S]*top:\s*var\(--cultivation-anchor-y\)/);
  assert.doesNotMatch(orbStyles, /top:\s*56%/);
});
