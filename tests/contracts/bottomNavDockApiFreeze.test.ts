import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

function read(relPath: string): string {
  return readFileSync(resolve(process.cwd(), relPath), 'utf8');
}

test('BottomNavDock indicator vocabulary is intentionally narrow and frozen', () => {
  const file = read('src/ui/shell/BottomNavDock.tsx');
  assert.match(file, /type BottomNavDockIndicator = 'none' \| 'recommended' \| 'attention'/);
  assert.match(file, /BOTTOM_NAV_DOCK_INDICATOR_OPTIONS = \['none', 'recommended', 'attention'\] as const/);
});

test('BottomNavDock keeps compatibility hooks and bounded host attrs in contract', () => {
  const file = read('src/ui/shell/BottomNavDock.tsx');
  assert.match(file, /preserveLegacyHooks\?: boolean/);
  assert.match(file, /hostAttrs\?: BottomNavDockHostAttrs/);
  assert.match(file, /\[key in `aria-\$\{string\}`\]/);
  assert.match(file, /\[key in `data-\$\{string\}`\]/);
});

test('BottomNavDock keeps reserved indicator slot to avoid button-label reflow', () => {
  const file = read('src/ui/shell/BottomNavDock.tsx');
  assert.match(file, /bottomNavDock__indicatorSlot/);
  assert.match(file, /indicator === 'none' \? null/);
});
