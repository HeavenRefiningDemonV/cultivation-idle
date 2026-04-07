import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

function read(relPath: string): string {
  return readFileSync(resolve(process.cwd(), relPath), 'utf8');
}

test('InspectorDrawer exposes canonical structural fallback API and header modes', () => {
  const file = read('src/ui/shell/InspectorDrawer.tsx');
  assert.match(file, /export type InspectorDrawerHeaderMode = 'title' \| 'close-only'/);
  assert.match(file, /INSPECTOR_DRAWER_HEADER_MODE_OPTIONS = \['title', 'close-only'\] as const/);
  assert.match(file, /open: boolean/);
  assert.match(file, /onClose: \(\) => void/);
  assert.match(file, /title\?: string/);
  assert.match(file, /headerMode\?: InspectorDrawerHeaderMode/);
});

test('InspectorDrawer labeling, close affordance, and bounded host attrs are explicit', () => {
  const file = read('src/ui/shell/InspectorDrawer.tsx');
  assert.match(file, /closeLabel = 'Close inspector'/);
  assert.match(file, /ariaLabel=\{title\}/);
  assert.match(file, /panelAttrs=\{hostAttrs\}/);
  assert.match(file, /closeButtonRef\.current\?\.focus\(\)/);
  assert.match(file, /export type InspectorDrawerHostAttrs/);
});

test('Modal exposes panelAttrs passthrough used by InspectorDrawer host attrs', () => {
  const file = read('src/ui/primitives/Modal.tsx');
  assert.match(file, /panelAttrs\?: ModalPanelAttrs/);
  assert.match(file, /\{\.\.\.panelAttrs\}/);
});
