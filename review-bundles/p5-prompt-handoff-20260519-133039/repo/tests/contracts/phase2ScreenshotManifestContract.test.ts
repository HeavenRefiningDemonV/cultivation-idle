import assert from 'node:assert/strict';
import test from 'node:test';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

function read(relPath: string): string {
  return readFileSync(resolve(process.cwd(), relPath), 'utf8');
}

void test('phase 2 screenshot manifest exists and keeps explicit surface classifications', () => {
  const file = 'docs/ui/phase-2-screenshot-manifest.md';
  assert.equal(existsSync(resolve(process.cwd(), file)), true);
  const source = read(file);

  [
    'primary proof surface',
    'secondary already-opted-in compact consumer',
    'adjacent evidence root',
    'deferred / not part of Phase 2 proof',
  ].forEach((label) => assert.match(source, new RegExp(label)));
});

void test('manifest lists canonical primary set and does not silently promote section-c baseline surfaces', () => {
  const source = read('docs/ui/phase-2-screenshot-manifest.md');
  ['world', 'cultivation', 'status', 'prestige', 'prestige-ritual', 'current-chapter-exhausted', 'life-summary', 'change-heart-law', 'bottom-tab-bar'].forEach((id) => {
    assert.match(source, new RegExp(`\\| ${id} \\|`));
  });

  ['life-start-path', 'dao-heart-law'].forEach((id) => {
    assert.match(source, new RegExp(`\\| ${id} \\| .*deferred / not part of Phase 2 proof`));
  });
});

void test('canonical evidence folders declared in manifest exist on disk', () => {
  const requiredFolders = [
    'docs/release/qa/ui-cutover/phase-0-core-screens/04-world',
    'docs/release/qa/ui-cutover/phase-0-core-screens/02-cultivation',
    'docs/release/qa/ui-cutover/phase-0-core-screens/03-status',
    'docs/release/qa/ui-cutover/phase-0-core-screens/10-prestige',
    'docs/release/qa/ui-cutover/prestige-ritual',
    'docs/release/qa/ui-cutover/current-chapter-exhausted',
    'docs/release/qa/ui-cutover/life-summary',
    'docs/release/qa/ui-cutover/change-heart-law',
  ];

  requiredFolders.forEach((folder) => {
    assert.equal(existsSync(resolve(process.cwd(), folder)), true, `missing evidence folder: ${folder}`);
  });
});
