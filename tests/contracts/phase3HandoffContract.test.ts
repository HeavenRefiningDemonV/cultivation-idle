import assert from 'node:assert/strict';
import test from 'node:test';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

function read(relPath: string): string {
  return readFileSync(resolve(process.cwd(), relPath), 'utf8');
}

void test('phase 3 handoff doc exists and includes immediate next-phase target family', () => {
  const file = 'docs/ui/phase-2-phase3-handoff.md';
  assert.equal(existsSync(resolve(process.cwd(), file)), true);
  const source = read(file);

  ['Life Start', 'Path Selection', 'Heart Law selection'].forEach((label) => {
    assert.match(source, new RegExp(label));
  });
});

void test('handoff doc carries preserve-first / cutover / no-bypass rules explicitly', () => {
  const source = read('docs/ui/phase-2-phase3-handoff.md');

  assert.match(source, /Preserve-first doctrine/);
  assert.match(source, /Exact-screen cutover gate/);
  assert.match(source, /Readable gameplay truth must remain in DOM/);
  assert.match(source, /may not bypass/);
  assert.match(source, /move readable gameplay truth into Pixi-only layers/);
  assert.match(source, /remove old layers before exact-screen approval/);
});

void test('handoff doc keeps secondary surfaces from silent promotion', () => {
  const source = read('docs/ui/phase-2-phase3-handoff.md');
  assert.match(source, /silently promote secondary compact consumers to primary proof surfaces/);
});
