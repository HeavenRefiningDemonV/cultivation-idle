import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

function read(relPath: string): string {
  return readFileSync(resolve(process.cwd(), relPath), 'utf8');
}

test('WR-08 keeps world atmosphere within one-fog + sparse-motes budget with static reduced-motion fallback', () => {
  const worldFxScene = read('src/ui/fx/scenes/WorldFxScene.tsx');
  const cityMapScss = read('src/components/screens/CityMapHub.scss');

  assert.match(worldFxScene, /worldFxScene__fog/);
  assert.match(worldFxScene, /resolveMoteCount/);
  assert.match(worldFxScene, /if \(prefersReducedMotion \|\| effectiveQuality === 'reducedMotion'\) return 0/);
  assert.match(cityMapScss, /\.cityMapHubMap\[data-reduced-motion='1'\] \.cityMapHubHotspot/);
  assert.match(cityMapScss, /@media \(prefers-reduced-motion: reduce\)/);
  assert.match(cityMapScss, /transition: none;/);
});

test('WR-08 keeps selected and recommended map states explicit and non-color-only', () => {
  const cityMapHub = read('src/components/screens/CityMapHub.tsx');
  const cityMapScss = read('src/components/screens/CityMapHub.scss');

  assert.match(cityMapHub, /isActive \? 'cityMapHubHotspot--active'/);
  assert.match(cityMapHub, /isRecommended \? 'cityMapHubHotspot--recommended'/);
  assert.match(cityMapHub, /<span className="cityMapHubHotspotLabel">/);
  assert.match(cityMapScss, /\.cityMapHubHotspot--active/);
  assert.match(cityMapScss, /\.cityMapHubHotspot--recommended::before/);
  assert.match(cityMapScss, /\.cityMapHubHotspot:focus-visible/);
});
