import assert from 'node:assert/strict';
import test from 'node:test';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

function read(relPath: string): string {
  return readFileSync(resolve(process.cwd(), relPath), 'utf8');
}

void test('phase 2 exit audit doc exists and declares strict status vocabulary', () => {
  const file = 'docs/ui/phase-2-exit-audit.md';
  assert.equal(existsSync(resolve(process.cwd(), file)), true);
  const source = read(file);

  assert.match(source, /Status vocabulary used in this audit/);
  ['green', 'partial', 'blocked', 'absent'].forEach((word) => {
    assert.match(source, new RegExp(word));
  });
});

void test('phase 2 exit audit records packet matrix through p2-13 and primary proof surfaces', () => {
  const source = read('docs/ui/phase-2-exit-audit.md');
  ['P2-00', 'P2-01', 'P2-11', 'P2-13'].forEach((packetId) => {
    assert.match(source, new RegExp(`\\| ${packetId} \\|`));
  });

  [
    'WorldScreen',
    'CultivateScreen',
    'StatusScreen',
    'PrestigeScreen',
    'PrestigeRitualModal',
    'CurrentChapterExhaustedModal',
    'LifeSummaryModal',
    'ChangeHeartLawModal',
    'BottomTabBar',
  ].forEach((surfaceName) => {
    assert.match(source, new RegExp(surfaceName));
  });
});

void test('phase 2 exit audit includes cleanup authority limits and support-art reality', () => {
  const source = read('docs/ui/phase-2-exit-audit.md');
  assert.match(source, /Support-art reality statement/);
  assert.match(source, /does not grant mass cleanup authority/);
  assert.match(source, /scenic\/base layers remain/i);
});

void test('phase 2 exit audit documents packet naming drift and p2-03 presence', () => {
  const source = read('docs/ui/phase-2-exit-audit.md');
  assert.match(source, /phase-2-p2-03-shared-motion-token-normalization\.md/);
  assert.match(source, /framecard-plaqueheader/);
  assert.match(source, /scenic-label-contract/);
});
