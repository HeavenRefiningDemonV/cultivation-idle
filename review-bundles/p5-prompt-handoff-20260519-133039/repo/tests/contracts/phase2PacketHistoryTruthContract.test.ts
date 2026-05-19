import assert from 'node:assert/strict';
import test from 'node:test';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

function read(relPath: string): string {
  return readFileSync(resolve(process.cwd(), relPath), 'utf8');
}

void test('p2-03 packet doc exists with canonical naming', () => {
  const file = 'docs/ui/phase-2-p2-03-shared-motion-token-normalization.md';
  assert.equal(existsSync(resolve(process.cwd(), file)), true);
  const source = read(file);
  assert.match(source, /Shared motion token normalization/);
});

void test('packet register keeps canonical p2-06 and p2-10 naming with drift notes', () => {
  const source = read('docs/ui/phase-2-packet-register.md');
  assert.match(source, /phase-2-p2-06-shell-api-freeze/);
  assert.match(source, /framecard-plaqueheader/);
  assert.match(source, /phase-2-p2-10-secondary-consumer-containment/);
  assert.match(source, /scenic-label/);
});
