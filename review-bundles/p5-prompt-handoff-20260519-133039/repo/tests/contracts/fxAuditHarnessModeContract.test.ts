import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

function read(relPath: string): string {
  return readFileSync(resolve(process.cwd(), relPath), 'utf8');
}

test('phase-0 audit harness exposes high/medium/low/reduced and provider-level reduced override wiring', () => {
  const source = read('src/dev/phase0CoreAudit/Phase0CoreAuditHarness.tsx');
  assert.match(source, /type AuditFxMode = 'high' \| 'medium' \| 'low' \| 'reduced'/);
  assert.match(source, /<option value="medium">medium<\/option>/);
  assert.match(source, /setReducedMotionOverride\(fxMode === 'reduced' \? true : false\)/);
  assert.match(source, /return 'medium';/);
});

test('section-c audit harness exposes high/medium/low/reduced and provider-level reduced override wiring', () => {
  const source = read('src/dev/sectionCAudit/SectionCAuditHarness.tsx');
  assert.match(source, /type AuditFxMode = 'high' \| 'medium' \| 'low' \| 'reduced'/);
  assert.match(source, /<option value="medium">medium<\/option>/);
  assert.match(source, /setReducedMotionOverride\(fxMode === 'reduced' \? true : false\)/);
  assert.match(source, /return 'medium';/);
});
