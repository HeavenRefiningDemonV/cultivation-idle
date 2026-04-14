import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

function read(relPath: string): string {
  return readFileSync(resolve(process.cwd(), relPath), 'utf8');
}

void test('game layout mounts phase 6 combat audit harness without regressing existing harness wiring', () => {
  const source = read('src/components/GameLayout.tsx');
  assert.match(source, /isSectionCAuditQueryEnabled\(\)/);
  assert.match(source, /isPhase0CoreAuditQueryEnabled\(\)/);
  assert.match(source, /isPhase6CombatAuditQueryEnabled\(\)/);
  assert.match(source, /<SectionCAuditHarness \/>/);
  assert.match(source, /<Phase0CoreAuditHarness \/>/);
  assert.match(source, /<Phase6CombatAuditHarness \/>/);
});
