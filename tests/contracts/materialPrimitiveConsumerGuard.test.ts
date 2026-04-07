import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

function read(relPath: string): string {
  return readFileSync(resolve(process.cwd(), relPath), 'utf8');
}

const liveConsumers = [
  'src/components/screens/BountyBoardPanel.tsx',
  'src/components/screens/ExpeditionBoardPanel.tsx',
  'src/ui/primitives/DetailScrollModal.tsx',
] as const;

test('live current consumers no longer import ui/paper/index.js', () => {
  for (const file of liveConsumers) {
    const source = read(file);
    assert.doesNotMatch(source, /ui\/paper\/index\.js/, `${file} should not import ui/paper/index.js`);
  }
});

test('live current consumers import canonical primitives from ui/ink and ui/shell', () => {
  const bounty = read('src/components/screens/BountyBoardPanel.tsx');
  const expedition = read('src/components/screens/ExpeditionBoardPanel.tsx');
  const detailModal = read('src/ui/primitives/DetailScrollModal.tsx');

  assert.match(bounty, /from '\.\.\/\.\.\/ui\/ink\/index\.js'/);
  assert.match(bounty, /from '\.\.\/\.\.\/ui\/shell\/PaperStamp\.js'/);

  assert.match(expedition, /from '\.\.\/\.\.\/ui\/ink\/index\.js'/);
  assert.match(expedition, /from '\.\.\/\.\.\/ui\/shell\/PaperStamp\.js'/);

  assert.match(detailModal, /from '\.\.\/ink\/index\.js'/);
});

test('migrated board chips explicitly preserve compact width behavior', () => {
  const bounty = read('src/components/screens/BountyBoardPanel.tsx');
  const expedition = read('src/components/screens/ExpeditionBoardPanel.tsx');

  assert.match(bounty, /reserveEndSpace=\{false\}/, 'bounty board should disable reserved end-space widening');
  assert.match(expedition, /reserveEndSpace=\{false\}/, 'expedition board should disable reserved end-space widening');
});
