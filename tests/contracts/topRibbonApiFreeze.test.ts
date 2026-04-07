import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

function read(relPath: string): string {
  return readFileSync(resolve(process.cwd(), relPath), 'utf8');
}

test('TopRibbon exposes frozen option registries and bounded host attrs', () => {
  const file = read('src/ui/shell/TopRibbon.tsx');

  assert.match(file, /TOP_RIBBON_VARIANT_OPTIONS = \['hero', 'world', 'dense'\] as const/);
  assert.match(file, /TOP_RIBBON_DENSITY_OPTIONS = \['compact', 'default'\] as const/);
  assert.match(file, /TOP_RIBBON_TONE_OPTIONS = \['paper', 'ink'\] as const/);
  assert.match(file, /TOP_RIBBON_ITEM_TONE_OPTIONS = \['neutral', 'bronze', 'jade', 'warning', 'seal'\] as const/);
  assert.match(file, /export type TopRibbonHostAttrs/);
  assert.match(file, /\[key in `aria-\$\{string\}`\]/);
  assert.match(file, /\[key in `data-\$\{string\}`\]/);
});

test('TopRibbon custom header precedence is explicit and auto-header truth does not double render', () => {
  const file = read('src/ui/shell/TopRibbon.tsx');

  assert.match(file, /header \?\? buildAutoHeader/);
  assert.match(file, /`header` takes precedence; auto-header props/);
});

test('TopRibbon public contract is exported from ui\\/shell barrel', () => {
  const file = read('src/ui/shell/index.ts');
  assert.match(file, /TOP_RIBBON_VARIANT_OPTIONS/);
  assert.match(file, /TOP_RIBBON_DENSITY_OPTIONS/);
  assert.match(file, /TOP_RIBBON_TONE_OPTIONS/);
  assert.match(file, /TOP_RIBBON_ITEM_TONE_OPTIONS/);
  assert.match(file, /TopRibbonHostAttrs/);
});
