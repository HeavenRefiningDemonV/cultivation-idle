import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

function read(relPath: string): string {
  return readFileSync(resolve(process.cwd(), relPath), 'utf8');
}

test('WR-04 inspector hierarchy keeps selected module dominant and avoids old guide panels', () => {
  const worldScreen = read('src/components/screens/WorldScreen.tsx');

  const inspectorModuleIndex = worldScreen.indexOf('const inspectorModuleKey = useMemo');
  const inspectorLabelIndex = worldScreen.indexOf('const inspectorLabel =');
  const inspectorRenderIndex = worldScreen.indexOf('<WorldOverlayInspector');

  assert.ok(inspectorModuleIndex >= 0, 'Selected module resolver should exist.');
  assert.ok(inspectorLabelIndex > inspectorModuleIndex, 'Inspector label should derive from selected module.');
  assert.ok(inspectorRenderIndex > inspectorLabelIndex, 'Inspector render should follow selected module derivation.');
  assert.doesNotMatch(worldScreen, /const inspectorLocalLens =|LocalMandateLensHeader|buildLocalMandateLensSurface/);
  assert.match(worldScreen, /onOpen=\{\(\) => handleRouteToModule\(inspectorModuleKey\)\}/);
  const inspectorBodyStart = worldScreen.indexOf('const inspectorModuleKey = useMemo');
  const inspectorBodyEnd = worldScreen.indexOf('return (', inspectorBodyStart);
  assert.ok(inspectorBodyStart >= 0 && inspectorBodyEnd > inspectorBodyStart, 'Expected inspector derivation block.');
  const inspectorBodyBlock = worldScreen.slice(inspectorBodyStart, inspectorBodyEnd);
  assert.doesNotMatch(inspectorBodyBlock, /<RunCompass/);
});
