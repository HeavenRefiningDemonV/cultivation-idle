import assert from 'node:assert/strict';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const readSource = async (relativePath: string) =>
  fs.readFile(path.join(process.cwd(), relativePath), 'utf8');

test('ritual and AP breakdown modals use canonical prestige state vocabulary', async () => {
  const ritual = await readSource('src/components/modals/PrestigeRitualModal.tsx');
  const breakdown = await readSource('src/components/modals/ApBreakdownModal.tsx');

  assert.equal(ritual.includes('Eligible'), false);
  assert.equal(ritual.includes('Sealed'), false);
  assert.equal(breakdown.includes('sealed until Foundation Establishment'), false);
  assert.equal(ritual.includes('advisorLabel'), true);
  assert.equal(breakdown.includes('advisorLabel'), true);
});

test('prestige screen bridges to advisor reset buckets and recommendation strip', async () => {
  const screen = await readSource('src/components/screens/PrestigeScreen.tsx');

  assert.equal(screen.includes('advisor.resetPreview'), true);
  assert.equal(screen.includes('Top recommended decree'), true);
  assert.equal(screen.includes('RunCompassCompact'), true);
});
