import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import test from 'node:test';

void test('P10 mockup surface exposes explicit quality mode token and stable planning scaffold anchors', async () => {
  const source = await fs.readFile('src/features/world/outskirts/OutskirtsExactMockupScreen.ts', 'utf8');

  assert.match(source, /OutskirtsExactMockupQualityMode = 'high-fx' \| 'low-fx' \| 'reduced-motion'/);
  assert.match(source, /'data-quality-mode': qualityMode/);
  assert.match(source, /'data-testid': 'outskirts-exact-screen'/);
  assert.match(source, /'data-testid': 'outskirts-exact-top-region'/);
  assert.match(source, /'data-testid': 'outskirts-exact-lower-scaffold'/);
  assert.match(source, /'data-testid': 'outskirts-exact-action-zone'/);
});

void test('P10 planning branch maps FX state to high\/low\/reduced quality mode tokens', async () => {
  const panelSource = await fs.readFile('src/components/screens/world/buildings/OutskirtsBuildingPanel.tsx', 'utf8');
  const scssSource = await fs.readFile('src/features/world/outskirts/OutskirtsExactMockupScreen.scss', 'utf8');

  assert.match(panelSource, /effectiveQuality === 'reducedMotion'/);
  assert.match(panelSource, /\? 'reduced-motion'/);
  assert.match(panelSource, /effectiveQuality === 'low'/);
  assert.match(panelSource, /\? 'low-fx'/);
  assert.match(panelSource, /qualityMode=\{qualityMode\}/);

  assert.match(scssSource, /\.outskirtsExactScreen--high-fx\s+\.outskirtsExactField__overlay/);
  assert.match(scssSource, /\.outskirtsExactScreen--low-fx\s+\.outskirtsExactField__overlay/);
  assert.match(scssSource, /\.outskirtsExactScreen--reduced-motion\s+\.outskirtsExactField__overlay/);
  assert.match(scssSource, /@media \(prefers-reduced-motion: reduce\)/);
});
