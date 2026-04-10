import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

function read(relPath: string): string {
  return readFileSync(resolve(process.cwd(), relPath), 'utf8');
}

test('cultivation scene consumes budget/dormant contract signals explicitly', () => {
  const source = read('src/ui/fx/scenes/CultivationFxScene.tsx');
  assert.match(source, /budget\.allowGlints/);
  assert.match(source, /budget\.particleDensity/);
  assert.match(source, /budget\.allowHeroPulse/);
  assert.match(source, /props\.dormant/);
  assert.match(source, /props\.canAnimateContinuously/);
  assert.match(source, /data-dormant=/);
  assert.match(source, /data-can-animate=/);
});

test('status scene consumes budget/dormant contract signals explicitly', () => {
  const source = read('src/ui/fx/scenes/StatusFxScene.tsx');
  assert.match(source, /budget\.allowGlints/);
  assert.match(source, /budget\.continuousAtmosphere/);
  assert.match(source, /budget\.allowHeroPulse/);
  assert.match(source, /props\.dormant/);
  assert.match(source, /props\.canAnimateContinuously/);
  assert.match(source, /data-dormant=/);
  assert.match(source, /data-can-animate=/);
});

test('world scene remains atmospheric-only and subordinate while forge\/selection stay null outputs', () => {
  const worldSource = read('src/ui/fx/scenes/WorldFxScene.tsx');
  assert.match(worldSource, /className="worldFxScene"/);
  assert.match(worldSource, /aria-hidden="true"/);
  assert.match(worldSource, /resolveMoteCount/);
  assert.match(read('src/ui/fx/scenes/ForgeFxScene.tsx'), /return null;/);
  assert.match(read('src/ui/fx/scenes/SelectionFxScene.tsx'), /return null;/);
});
