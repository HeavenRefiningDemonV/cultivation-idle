import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

function read(relPath: string): string {
  return readFileSync(resolve(process.cwd(), relPath), 'utf8');
}

test('WorldScreen keeps map-owned DOM command surfaces layered under overlay guidance', () => {
  const worldScreen = read('src/components/screens/WorldScreen.tsx');
  const worldStyles = read('src/components/screens/WorldScreen.scss');

  assert.match(worldScreen, /<CityMapHub/);
  assert.match(worldScreen, /<WorldOverlayRibbon/);
  assert.match(worldScreen, /<WorldOverlayInspector/);
  assert.match(worldScreen, /buildWorldModuleRoutingSurface/);
  assert.doesNotMatch(worldScreen, /buildWorldMandateRoutingLensSurface/);
  assert.match(worldStyles, /\.worldScreenMapLayer \{[\s\S]*z-index: 10;/);
  assert.match(worldStyles, /\.worldScreenRibbonLayer \{[\s\S]*z-index: 30;[\s\S]*pointer-events: none;/);
  assert.match(worldStyles, /\.worldScreenInspectorLayer \{[\s\S]*z-index: 40;[\s\S]*pointer-events: none;/);
});

test('World atmosphere honors quality and reduced-motion fallback semantics', () => {
  const worldFxScene = read('src/ui/fx/scenes/WorldFxScene.tsx');
  const cityMapHub = read('src/components/screens/CityMapHub.tsx');

  assert.match(worldFxScene, /effectiveQuality/);
  assert.match(worldFxScene, /prefersReducedMotion/);
  assert.match(worldFxScene, /if \(prefersReducedMotion \|\| effectiveQuality === 'reducedMotion'\) return 0/);
  assert.match(cityMapHub, /data-atmosphere-quality=\{atmosphereQuality\}/);
  assert.match(cityMapHub, /data-reduced-motion=\{prefersReducedMotion \? '1' : '0'\}/);
  assert.match(cityMapHub, /isGlinting \? 'cityMapHubHotspot--glint'/);
  assert.match(cityMapHub, /isRecommended \? 'cityMapHubHotspot--recommended'/);
});
