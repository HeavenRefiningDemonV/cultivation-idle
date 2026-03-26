import assert from 'node:assert/strict';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const readRepoFile = (relativePath: string) => fs.readFile(path.resolve(process.cwd(), relativePath), 'utf8');

test('critical live detail modals do not use ◎ placeholder fallback glyphs', async () => {
  const [techniqueDetail, manualDetail] = await Promise.all([
    readRepoFile('src/components/modals/TechniqueDetailModal.tsx'),
    readRepoFile('src/components/modals/ManualDetailModal.tsx'),
  ]);

  assert.doesNotMatch(techniqueDetail, /◎/);
  assert.doesNotMatch(manualDetail, /◎/);
});

test('critical cultivation controls keep no-shift hover interaction', async () => {
  const cultivateStyles = await readRepoFile('src/components/screens/CultivateScreen.scss');
  assert.equal(
    cultivateStyles.includes('.daoHeartSealButton:hover,\n.daoHeartSealButton:focus-visible {\n  transform: translateY(-1px);'),
    false,
  );
  assert.equal(
    cultivateStyles.includes('.cultivationActionButton:hover,\n.cultivationActionButton:focus-visible {\n  transform: translateY(-1px);'),
    false,
  );
});

test('live expedition route card no longer uses cold indigo accent values', async () => {
  const worldStyles = await readRepoFile('src/components/screens/WorldScreen.scss');
  assert.doesNotMatch(worldStyles, /99,\s*102,\s*241/);
  assert.doesNotMatch(worldStyles, /c084fc/i);
  assert.doesNotMatch(worldStyles, /38bdf8/i);
});
