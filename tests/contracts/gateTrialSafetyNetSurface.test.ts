import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

function read(relPath: string): string {
  return readFileSync(resolve(process.cwd(), relPath), 'utf8');
}

test('P6.3A safety-net surface shows eligible failures, cost, and reserves', () => {
  const card = read('src/ui/trials/GateTrialSafetyNetCard.tsx');

  assert.match(card, /Eligible Failures:/);
  assert.match(card, /Threshold:/);
  assert.match(card, /Cost:/);
  assert.match(card, /Current reserve: Gold/);
  assert.match(card, /Safety Net resolved for this gate/);
});
