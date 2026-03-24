import assert from 'node:assert/strict';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const readSource = async (relativePath: string) =>
  fs.readFile(path.join(process.cwd(), relativePath), 'utf8');

test('prestige screen uses advisor vocabulary and reset contract headings', async () => {
  const source = await readSource('src/components/screens/PrestigeScreen.tsx');
  const advisor = await readSource('src/features/prestige/prestigeAdvisorSurface.ts');

  assert.equal(advisor.includes('Too Early'), true);
  assert.equal(advisor.includes('Viable'), true);
  assert.equal(advisor.includes('Recommended'), true);
  assert.equal(source.includes('AP Forecast'), true);
  assert.equal(source.includes('Resets This Life'), true);
  assert.equal(source.includes('Carries Forward'), true);
  assert.equal(source.includes('Rebuilt Next Life'), true);
});

test('prestige screen removes stale lock messaging and stale local keep/reset arrays', async () => {
  const source = await readSource('src/components/screens/PrestigeScreen.tsx');

  assert.equal(source.includes('Reach Foundation Establishment to unlock Reincarnation.'), false);
  assert.equal(source.includes('Reincarnation Sealed'), false);
  assert.equal(source.includes('const keepBenefits ='), false);
  assert.equal(source.includes('const resetCosts ='), false);
});

test('prestige surfaces do not frame spirit root as literal carry-forward state', async () => {
  const screen = await readSource('src/components/screens/PrestigeScreen.tsx');
  const ritual = await readSource('src/components/modals/PrestigeRitualModal.tsx');

  assert.equal(screen.includes('Keep all Ascension Points'), false);
  assert.equal(ritual.includes('Receive a fresh spirit root for the next life'), false);
});
