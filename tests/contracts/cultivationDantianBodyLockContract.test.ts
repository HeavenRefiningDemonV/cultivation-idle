import assert from 'node:assert/strict';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import test from 'node:test';

async function readRepoFile(relativePath: string) {
  return fs.readFile(path.resolve(process.cwd(), relativePath), 'utf8');
}

test('dantian orb is body-locked to a cultivator figure anchor instead of qi-bar alignment', async () => {
  const screenSource = await readRepoFile('src/features/cultivation/exact/CultivationExactScreen.tsx');
  const screenStyles = await readRepoFile('src/features/cultivation/exact/CultivationExactScreen.scss');
  const orbStyles = await readRepoFile('src/ui/cultivation/DantianOrb.scss');

  assert.match(screenSource, /data-testid="cultivation-dantian-anchor"/);
  assert.match(screenSource, /data-testid="cultivation-qi-lane"/);
  assert.match(screenSource, /cultivationExactAuraAnchor/);
  assert.match(screenSource, /onDantianAnchorChange/);
  assert.match(screenSource, /className="cultivationExactDantianAnchor"[\s\S]*<DantianOrb/);
  assert.match(screenStyles, /--dantian-anchor-x:\s*55\.75%/);
  assert.match(screenStyles, /--dantian-anchor-y:\s*50\.9%/);
  assert.match(screenStyles, /\.cultivationExactAuraAnchor\s*\{[\s\S]*left:\s*var\(--dantian-anchor-x\)[\s\S]*top:\s*var\(--dantian-anchor-y\)/);
  assert.match(screenStyles, /\.cultivationExactDantianAnchor\s*\{[\s\S]*left:\s*var\(--dantian-anchor-x\)[\s\S]*top:\s*var\(--dantian-anchor-y\)/);
  assert.match(screenStyles, /\.cultivationExactQiRail\s*\{[\s\S]*z-index:\s*24/);
  assert.doesNotMatch(screenStyles, /\.cultivationSceneLayer \.dantianOrb\s*\{[\s\S]*top:\s*var\(--cultivation-anchor-y\)/);
  assert.match(screenStyles, /width:\s*clamp\(72px,\s*5\.2vw,\s*108px\)/);
  assert.match(screenStyles, /height:\s*clamp\(72px,\s*5\.2vw,\s*108px\)/);
  assert.match(screenStyles, /transform:\s*translate\(-50%,\s*-50%\)\s*scale/);
  assert.match(orbStyles, /width:\s*100%/);
  assert.match(orbStyles, /height:\s*100%/);
  assert.doesNotMatch(orbStyles, /top:\s*56%/);
});
