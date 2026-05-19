import assert from 'node:assert/strict';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import test from 'node:test';

async function readRepoFile(relativePath: string) {
  return fs.readFile(path.resolve(process.cwd(), relativePath), 'utf8');
}

test('doctrine summary renders verse rail inside the Heart Law row for summary and detail states', async () => {
  const source = await readRepoFile('src/ui/cultivation/CultivationDoctrineSummary.tsx');

  assert.match(source, /row\.label === 'Heart Law' && verseSlot/);
  assert.match(source, /cultivationDoctrinePanel__verseSlot--summary/);
  assert.match(source, /cultivationDoctrinePanel__verseEyebrow/);
});
