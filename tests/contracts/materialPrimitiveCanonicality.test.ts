import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

function read(relPath: string): string {
  return readFileSync(resolve(process.cwd(), relPath), 'utf8');
}

test('ui/ink barrel is explicitly canonical and ui/paper barrel is explicitly compatibility-only', () => {
  const inkIndex = read('src/ui/ink/index.ts');
  const paperIndex = read('src/ui/paper/index.ts');

  assert.match(inkIndex, /Canonical material primitive family/i);
  assert.match(paperIndex, /Compatibility-only exports/i);
});

test('ui/paper wrappers are thin adapters over canonical ui/ink primitives', () => {
  const paperCard = read('src/ui/paper/PaperCard.tsx');
  const paperChip = read('src/ui/paper/PaperChip.tsx');
  const paperStamp = read('src/ui/paper/PaperStamp.tsx');

  assert.match(paperCard, /from '\.\.\/ink\/PaperCard\.js'/);
  assert.match(paperChip, /from '\.\.\/ink\/PaperChip\.js'/);
  assert.match(paperStamp, /from '\.\.\/shell\/PaperStamp\.js'/);
});

test('ui/paper stylesheet is compatibility-only and not a second material owner', () => {
  const paperScss = read('src/ui/paper/paper.scss');
  assert.match(paperScss, /Compatibility layer only/i);
  assert.doesNotMatch(paperScss, /radial-gradient\(|paperChipShimmer|paperCard::before|paperCard--interactive:hover/);
});
