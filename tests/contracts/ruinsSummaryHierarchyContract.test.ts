import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';

void test('ruins summary card foregrounds deterministic trio and keeps boundary secondary', async () => {
  const source = await readFile(new URL('../../src/ui/world/RuinsSummaryCard.tsx', import.meta.url), 'utf8');

  assert.match(source, /Deterministic value preview/);
  assert.match(source, /anchorLine/);
  assert.match(source, /leadMaterialsLine/);
  assert.match(source, /rarePityLine/);
  assert.match(source, /ruinsSummaryCard__boundary/);
  assert.match(source, /ruinsSummaryCard__supportRow/);
});
