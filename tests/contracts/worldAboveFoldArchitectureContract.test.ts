import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

function read(relPath: string): string {
  return readFileSync(resolve(process.cwd(), relPath), 'utf8');
}

test('WR-02 world above-the-fold anatomy keeps command band before map + inspector shell', () => {
  const worldScreen = read('src/components/screens/WorldScreen.tsx');
  const commandBandIndex = worldScreen.indexOf('worldScreenCommandBand" aria-label="World command band"');
  const shellLayoutIndex = worldScreen.indexOf('worldScreenShellLayout');
  const mapPanelIndex = worldScreen.indexOf('worldScreenHubPanel');
  const inspectorRegionIndex = worldScreen.indexOf('worldScreenInspectorRegion');

  assert.ok(commandBandIndex >= 0, 'World command band should exist.');
  assert.ok(shellLayoutIndex > commandBandIndex, 'Shell layout should follow the command band in render order.');
  assert.ok(mapPanelIndex > shellLayoutIndex, 'Map panel should be inside the shell layout after command band.');
  assert.ok(inspectorRegionIndex > shellLayoutIndex, 'Inspector region should remain in shell layout.');
});

test('WR-02 keeps full run compass in main flow and keeps support slot subordinate', () => {
  const worldScreen = read('src/components/screens/WorldScreen.tsx');
  assert.match(worldScreen, /<RunCompass surface=\{runCompass\.full\}/);
  assert.match(worldScreen, /worldScreenSupportSlot/);
  assert.match(worldScreen, /worldSupportRail/);
  assert.doesNotMatch(worldScreen, /worldScreenHubShellHeader/);
});
