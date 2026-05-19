import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

function read(relPath: string): string {
  return readFileSync(resolve(process.cwd(), relPath), 'utf8');
}

test('P6.3A gate-trial attempt labels are locked and exact', () => {
  const adapters = read('src/systems/readiness/section5Adapters.ts');

  assert.match(adapters, /primaryLabel: 'Not Ready'/);
  assert.match(adapters, /primaryLabel: 'Attempt Gate'/);
  assert.match(adapters, /primaryLabel: 'Attempt Anyway'/);
  assert.match(adapters, /primaryLabel: 'Buy Safety Net'/);
  assert.match(adapters, /primaryLabel: 'Break Through'/);
  assert.match(adapters, /state: 'break_through'/);
});
