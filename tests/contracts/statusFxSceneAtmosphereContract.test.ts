import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

function read(relPath: string): string {
  return readFileSync(resolve(process.cwd(), relPath), 'utf8');
}

test('status fx scene keeps atmosphere-only DOM contract with explicit budget gating', () => {
  const source = read('src/ui/fx/scenes/StatusFxScene.tsx');
  assert.match(source, /statusFxScene__halo/);
  assert.match(source, /statusFxScene__ring/);
  assert.match(source, /statusFxScene__mist/);
  assert.match(source, /statusFxScene__glint/);
  assert.match(source, /data-glints=/);
  assert.match(source, /data-mists=/);
  assert.match(source, /data-resonance=/);
  assert.match(source, /data-urgency=/);
  assert.doesNotMatch(source, /Biggest Shortfall|Readiness|Best Next Action|Safety Net/);
});

test('status atmosphere quality fallback rules keep low and reduced motion calm', () => {
  const styles = read('src/components/screens/StatusScreen.scss');
  assert.match(styles, /\.statusFxScene\[data-quality="low"\]\s+\.statusFxScene__mist,\n\.statusFxScene\[data-quality="low"\]\s+\.statusFxScene__glint\s+\{\n\s+display: none;/);
  assert.match(styles, /\.statusFxScene\[data-quality="reducedMotion"\][\s\S]*\.statusFxScene__mist,\n\.statusFxScene\[data-quality="reducedMotion"\]\s+\.statusFxScene__glint\s+\{\n\s+display: none;/);
  assert.match(styles, /@media \(prefers-reduced-motion: reduce\)[\s\S]*\.statusFxScene__mist,\n\s+\.statusFxScene__glint \{\n\s+display: none;/);
});
