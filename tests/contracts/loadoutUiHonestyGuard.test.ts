import assert from 'node:assert/strict';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import test from 'node:test';

test('packet 4.7 TechniqueLibraryScreen uses the loadout snapshot honesty layer for equipped-now summaries', async () => {
  const source = await fs.readFile(path.join(process.cwd(), 'src/components/screens/TechniqueLibraryScreen.tsx'), 'utf8');

  assert.equal(source.includes('buildLoadoutSnapshot'), true);
  assert.equal(source.includes('Equipped now:'), true);
  assert.equal(source.includes('slots.active.filter(Boolean)'), false);
  assert.equal(source.includes('slots.passive.filter(Boolean)'), false);
});

test('packet 4.7 TechniqueLibraryScreen no longer marks all raw stored slot ids as currently equipped', async () => {
  const source = await fs.readFile(path.join(process.cwd(), 'src/components/screens/TechniqueLibraryScreen.tsx'), 'utf8');

  assert.equal(source.includes('selectedLoadout.slots.active.forEach'), false);
  assert.equal(source.includes('selectedLoadout.slots.passive.forEach'), false);
});

test('packet 4.7 TechniqueLearnedModal respects progression lock state instead of deriving its picker solely from raw loadout arrays', async () => {
  const source = await fs.readFile(path.join(process.cwd(), 'src/components/modals/TechniqueLearnedModal.tsx'), 'utf8');

  assert.equal(source.includes('getSlotProgressionSnapshot'), true);
  assert.equal(source.includes('Unlocks at'), true);
  assert.equal(source.includes('const slotNames = loadout'), false);
});

test('packet 4.7 TechniqueDetailModal distinguishes equipped-now from parked locked assignments', async () => {
  const source = await fs.readFile(path.join(process.cwd(), 'src/components/modals/TechniqueDetailModal.tsx'), 'utf8');

  assert.equal(source.includes('buildLoadoutSnapshot'), true);
  assert.equal(source.includes('parkedLockedAssignments'), true);
  assert.equal(source.includes('Equipped now in:'), true);
  assert.equal(source.includes('Parked in locked slot:'), true);
  assert.equal(source.includes('selectedLoadout.slots.active.findIndex'), false);
  assert.equal(source.includes('selectedLoadout.slots.passive.findIndex'), false);
});
