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

  assert.match(screenSource, /data-testid="cultivation-hero-figure"/);
  assert.match(screenSource, /data-testid="cultivation-dantian-anchor"/);
  assert.match(screenSource, /data-testid="cultivation-qi-lane"/);
  assert.match(screenSource, /className="cultivationHeroFigure"[\s\S]*className="cultivationHeroAbdomenAnchor"[\s\S]*<DantianOrb/);
  assert.match(screenStyles, /\.cultivationHeroFigure\s*\{[\s\S]*--dantian-anchor-x:\s*50%[\s\S]*--dantian-anchor-y:\s*60%/);
  assert.match(screenStyles, /\.cultivationHeroAbdomenAnchor\s*\{[\s\S]*left:\s*var\(--dantian-anchor-x\)[\s\S]*top:\s*var\(--dantian-anchor-y\)/);
  assert.match(screenStyles, /\.cultivationQiLane\s*\{[\s\S]*z-index:\s*6/);
  assert.doesNotMatch(screenStyles, /\.cultivationSceneLayer \.dantianOrb\s*\{[\s\S]*top:\s*var\(--cultivation-anchor-y\)/);
  assert.match(orbStyles, /width:\s*clamp\(72px,\s*4\.8vw,\s*96px\)/);
  assert.match(orbStyles, /height:\s*clamp\(72px,\s*4\.8vw,\s*96px\)/);
  assert.doesNotMatch(orbStyles, /top:\s*56%/);
});
