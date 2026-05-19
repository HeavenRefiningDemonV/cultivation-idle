import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

function read(relPath: string): string {
  return readFileSync(resolve(process.cwd(), relPath), 'utf8');
}

test('paper card wrapper preserves legacy complete/claimed and legacy class hooks', () => {
  const source = read('src/ui/paper/PaperCard.tsx');

  assert.match(source, /complete\s*=\s*false/);
  assert.match(source, /claimed\s*=\s*false/);

  for (const hook of ['paperCard', 'paperCard--interactive', 'paperCard--selected', 'isComplete', 'isClaimed', 'isDisabled']) {
    assert.match(source, new RegExp(hook.replace(/[-]/g, '\\-')));
  }
});

test('paper chip wrapper preserves legacy tone vocabulary and class hooks while delegating to canonical chip', () => {
  const source = read('src/ui/paper/PaperChip.tsx');

  for (const tone of ['neutral', 'ink', 'danger', 'success', 'rare', 'merit']) {
    assert.match(source, new RegExp(`'${tone}'`));
  }

  assert.match(source, /paperChip--tone-\$\{tone\}/);
  assert.match(source, /paperChip__icon/);
  assert.match(source, /paperChip__text/);
  assert.match(source, /reserveEndSpace=\{false\}/);
});
