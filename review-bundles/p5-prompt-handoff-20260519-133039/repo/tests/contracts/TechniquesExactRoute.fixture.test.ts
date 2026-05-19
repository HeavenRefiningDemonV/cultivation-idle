import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

test('techniques main tab routes to exact owner by default and keeps legacy fallback explicit', () => {
  const source = readFileSync('src/components/GameLayout.tsx', 'utf8');

  assert.match(source, /TechniquesScreenOwner/);
  assert.match(source, /TechniqueLibraryScreen/);
  assert.match(source, /techniquesExactMode/);
  assert.match(source, /techniquesExactMode[^]*legacy/);
  assert.match(source, /activeTab === 'techniques'/);
  assert.doesNotMatch(source, /WorldBuildingModal[^]*TechniquesScreenOwner/);
});
