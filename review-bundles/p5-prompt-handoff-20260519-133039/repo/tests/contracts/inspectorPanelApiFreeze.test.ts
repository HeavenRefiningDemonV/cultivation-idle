import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

function read(relPath: string): string {
  return readFileSync(resolve(process.cwd(), relPath), 'utf8');
}

test('InspectorPanel exposes frozen variant, density, tone, and empty-zone vocabularies', () => {
  const file = read('src/ui/shell/InspectorPanel.tsx');
  assert.match(file, /INSPECTOR_PANEL_VARIANT_OPTIONS = \['world', 'module', 'dense'\] as const/);
  assert.match(file, /INSPECTOR_PANEL_DENSITY_OPTIONS = \['compact', 'default'\] as const/);
  assert.match(file, /INSPECTOR_PANEL_TONE_OPTIONS = \['paper', 'ink'\] as const/);
  assert.match(file, /INSPECTOR_PANEL_EMPTY_ZONE_BEHAVIOR_OPTIONS = \['reserve', 'collapse'\] as const/);
});

test('InspectorPanel header precedence and bounded host attrs are explicit', () => {
  const file = read('src/ui/shell/InspectorPanel.tsx');
  assert.match(file, /`header` takes precedence; auto-header props are ignored/);
  assert.match(file, /const resolvedHeader = header \?\? buildAutoHeader/);
  assert.match(file, /export type InspectorPanelHostAttrs/);
  assert.match(file, /\[key in `aria-\$\{string\}`\]/);
  assert.match(file, /\[key in `data-\$\{string\}`\]/);
});

test('InspectorPanel zone order remains status, recommendation, body, footer', () => {
  const file = read('src/ui/shell/InspectorPanel.tsx');
  const statusIndex = file.indexOf('inspectorPanel__statusArea');
  const recommendationIndex = file.indexOf('inspectorPanel__recommendationArea');
  const bodyIndex = file.indexOf('inspectorPanel__body');
  const footerIndex = file.indexOf('inspectorPanel__footer');

  assert.ok(statusIndex > -1);
  assert.ok(recommendationIndex > statusIndex);
  assert.ok(bodyIndex > recommendationIndex);
  assert.ok(footerIndex > bodyIndex);
});
