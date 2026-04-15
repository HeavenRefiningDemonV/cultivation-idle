import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

function read(relPath: string): string {
  return readFileSync(resolve(process.cwd(), relPath), 'utf8');
}

test('P6.2I FX tier contract keeps reduced/low coherent and calm', () => {
  const panel = read('src/components/screens/world/buildings/RuinsBuildingPanel.tsx');
  const scene = read('src/ui/fx/scenes/RuinsFxScene.tsx');
  const sceneStyle = read('src/ui/fx/scenes/RuinsFxScene.scss');

  assert.match(panel, /effectiveQuality === 'low'/);
  assert.match(panel, /prefersReducedMotion/);
  assert.match(panel, /ambientHazeTier/);
  assert.match(scene, /if \(props\.effectiveQuality === 'medium'\) return 3/);
  assert.match(sceneStyle, /data-quality='low'\] \.ruinsFxScene__dustField/);
  assert.match(sceneStyle, /data-quality='reducedMotion'\] \.ruinsFxScene__dustField/);
});
