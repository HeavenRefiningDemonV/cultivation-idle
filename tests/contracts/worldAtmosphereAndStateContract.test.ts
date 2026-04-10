import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

function read(relPath: string): string {
  return readFileSync(resolve(process.cwd(), relPath), 'utf8');
}

test('WR-08 keeps world atmosphere within one-fog + sparse-motes budget with static reduced-motion fallback', () => {
  const worldFxScene = read('src/ui/fx/scenes/WorldFxScene.tsx');
  const worldScreenScss = read('src/components/screens/WorldScreen.scss');

  assert.match(worldFxScene, /worldFxScene__fog/);
  assert.match(worldFxScene, /resolveMoteCount/);
  assert.match(worldFxScene, /if \(prefersReducedMotion \|\| effectiveQuality === 'reducedMotion'\) return 0/);
  assert.match(worldScreenScss, /\.worldFxScene__fog/);
  assert.match(worldScreenScss, /\.worldFxScene__mote/);
  assert.match(worldScreenScss, /\[data-reduced-motion='1'\] \.worldFxScene__mote \{\s*display: none;/);
});

test('WR-08 keeps selected stronger than recommended in atmosphere state hooks', () => {
  const worldFxScene = read('src/ui/fx/scenes/WorldFxScene.tsx');
  const worldScreenScss = read('src/components/screens/WorldScreen.scss');

  assert.match(worldFxScene, /data-has-selected/);
  assert.match(worldFxScene, /data-has-recommended/);
  assert.match(worldScreenScss, /\[data-has-selected='1'\] \.worldFxScene__stateHalo--selected/);
  assert.match(worldScreenScss, /\[data-has-recommended='1'\]\[data-has-selected='0'\] \.worldFxScene__stateHalo--recommended/);
});
