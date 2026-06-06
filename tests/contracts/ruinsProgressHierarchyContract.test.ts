import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';

void test('ruins progress keeps first-read and recap/history regions split', async () => {
  const source = await readFile('src/features/ruins/ui/RuinsProgress.tsx', 'utf8');
  const ctaSource = await readFile('src/features/ruins/ui/RuinsCtaZone.tsx', 'utf8');

  assert.match(source, /ruins-progress__rail/);
  assert.match(source, /ruins-progress__operations/);
  assert.match(source, /Run recap & history/);
  assert.match(source, /Boss Chest Rare Progress/);
  assert.match(source, /Current room:/);
  assert.match(source, /Run recap/);
  assert.match(source, /Recent runs/);
  assert.match(ctaSource, /actionState\.primaryActionLabel/);
  assert.match(ctaSource, /Continue farming ruins/);
});
