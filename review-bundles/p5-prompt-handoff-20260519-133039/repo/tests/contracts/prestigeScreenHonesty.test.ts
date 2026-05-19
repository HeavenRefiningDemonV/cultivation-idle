import assert from 'node:assert/strict';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const readSource = async (relativePath: string) =>
  fs.readFile(path.join(process.cwd(), relativePath), 'utf8');

test('prestige exact screen uses advisor vocabulary and reset contract headings', async () => {
  const wrapper = await readSource('src/components/screens/PrestigeScreen.tsx');
  const source = await readSource('src/features/prestige/prestigeLedgerExact/PrestigeLedgerExactScreen.tsx');
  const presentation = await readSource('src/features/prestige/prestigeLedgerExact/prestigeLedgerExactPresentation.ts');
  const advisor = await readSource('src/features/prestige/prestigeAdvisorSurface.ts');

  assert.equal(advisor.includes('Too Early'), true);
  assert.equal(advisor.includes('Viable'), true);
  assert.equal(advisor.includes('Recommended'), true);
  assert.equal(wrapper.includes('PrestigeLedgerScreenOwner'), true);
  assert.equal(source.includes('Reincarnation Ledger'), true);
  assert.equal(presentation.includes('Resets this life'), true);
  assert.equal(presentation.includes('Carries forward'), true);
  assert.equal(presentation.includes('Rebuilt next life'), true);
  assert.equal(source.includes('Heavenly Decrees'), false);
  assert.equal(source.includes('AP Forecast'), false);
});

test('prestige screen removes stale lock messaging and stale local keep/reset arrays', async () => {
  const source = await readSource('src/features/prestige/prestigeLedgerExact/PrestigeLedgerExactScreen.tsx');
  const advisor = await readSource('src/features/prestige/prestigeAdvisorSurface.ts');
  const store = await readSource('src/stores/prestigeStore.ts');

  assert.equal(source.includes('Reach Foundation Establishment to unlock Reincarnation.'), false);
  assert.equal(source.includes('Reincarnation Sealed'), false);
  assert.equal(source.includes('const keepBenefits ='), false);
  assert.equal(source.includes('const resetCosts ='), false);
  assert.equal(advisor.includes('RECOMMENDED_AP_THRESHOLD'), false);
  assert.equal(advisor.includes('Foundation Establishment before beginning Reincarnation'), false);
  assert.equal(store.includes('timeBonus'), false);
});

test('prestige surfaces do not frame spirit root as literal carry-forward state', async () => {
  const screen = await readSource('src/features/prestige/prestigeLedgerExact/PrestigeLedgerExactScreen.tsx');
  const ritual = await readSource('src/components/modals/PrestigeRitualModal.tsx');
  const breakdown = await readSource('src/components/modals/ApBreakdownModal.tsx');

  assert.equal(screen.includes('Keep all Ascension Points'), false);
  assert.equal(ritual.includes('Receive a fresh spirit root for the next life'), false);
  assert.equal(breakdown.includes('Time cultivated'), false);
  assert.equal(breakdown.includes('Every hour adds potential AP.'), false);
});
