import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

test('techniques exact pure screen stays store-free and reward-free', () => {
  const source = readFileSync('src/features/techniquesExact/TechniquesExactScreen.tsx', 'utf8');

  assert.doesNotMatch(source, /use[A-Z][A-Za-z]+Store/);
  assert.doesNotMatch(source, /RewardService/);
  assert.doesNotMatch(source, /openWorldBuildingModal|setActiveTab|equipTechnique|getState\(\)/);
});
