import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';

test('manual pavilion exact pure screen stays store-free and reward-free', () => {
  const screenPath = path.resolve('src/features/world/manualPavilionExact/ManualPavilionExactScreen.tsx');
  const source = fs.readFileSync(screenPath, 'utf8');

  assert.doesNotMatch(source, /use[A-Z][A-Za-z]+Store/);
  assert.doesNotMatch(source, /RewardService/);
  assert.doesNotMatch(source, /buyManual\(/);
  assert.doesNotMatch(source, /refreshStock\(/);
  assert.doesNotMatch(source, /openManualSatchel/);
  assert.match(source, /data-testid=\{surface\.meta\.rootTestId\}/);
  assert.match(source, /manualPavilionShelf__spineRail/);
  assert.match(source, /manualPavilionInspector/);
  assert.match(source, /manualPavilionBottomStrip/);
});
