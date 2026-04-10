import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

function read(relPath: string): string {
  return readFileSync(resolve(process.cwd(), relPath), 'utf8');
}

test('WorldScreen keeps atmosphere optional and subordinate to map-owned DOM command surfaces', () => {
  const worldScreen = read('src/components/screens/WorldScreen.tsx');
  const worldStyles = read('src/components/screens/WorldScreen.scss');

  assert.match(worldScreen, /<WorldFxScene/);
  assert.match(worldScreen, /<CityMapHub/);
  assert.match(worldScreen, /<RunCompass surface=\{runCompass\.full\}/);
  assert.match(worldScreen, /worldScreenHubAtmosphere/);
  assert.match(worldStyles, /pointer-events: none;/);
  assert.match(worldStyles, /\.worldScreenHubAtmosphere \{[\s\S]*z-index: 1;/);
  assert.match(worldStyles, /\.worldScreenHubPanel > \* \{[\s\S]*z-index: 2;/);
});

test('World atmosphere honors quality and reduced-motion fallback semantics', () => {
  const worldFxScene = read('src/ui/fx/scenes/WorldFxScene.tsx');
  const cityMapHub = read('src/components/screens/CityMapHub.tsx');

  assert.match(worldFxScene, /effectiveQuality/);
  assert.match(worldFxScene, /prefersReducedMotion/);
  assert.match(worldFxScene, /if \(prefersReducedMotion \|\| effectiveQuality === 'reducedMotion'\) return 0/);
  assert.match(cityMapHub, /data-atmosphere-quality=\{atmosphereQuality\}/);
  assert.match(cityMapHub, /data-reduced-motion=\{prefersReducedMotion \? '1' : '0'\}/);
  assert.match(cityMapHub, /cityMapHubHotspotGlint--active/);
  assert.match(cityMapHub, /cityMapHubHotspotGlint--recommended/);
});
