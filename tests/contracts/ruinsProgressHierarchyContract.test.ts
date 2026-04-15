import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';

void test('ruins progress keeps first-read and recap/history regions split', async () => {
  const source = await readFile(new URL('../../src/features/ruins/ui/RuinsProgress.tsx', import.meta.url), 'utf8');

  assert.match(source, /ruins-progress__primary/);
  assert.match(source, /ruins-progress__operations/);
  assert.match(source, /Run recap & history/);
  assert.match(source, /Continue farming ruins/);
  assert.match(source, /Boss Chest Rare Progress/);
  assert.match(source, /Current room:/);
  assert.match(source, /Run recap/);
  assert.match(source, /Recent runs/);
});
