import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

function read(relPath: string): string {
  return readFileSync(resolve(process.cwd(), relPath), 'utf8');
}

test('WR-04 inspector hierarchy keeps selected-building dominant with secondary city context and tertiary note', () => {
  const worldScreen = read('src/components/screens/WorldScreen.tsx');

  const selectedBlockIndex = worldScreen.indexOf('worldCommandSummary--selectedModule');
  const cityBlockIndex = worldScreen.indexOf('worldCommandSummary--cityContextSecondary');
  const supportNoteIndex = worldScreen.indexOf('worldInspectorAlertEmpty');

  assert.ok(selectedBlockIndex >= 0, 'Selected-building block should exist.');
  assert.ok(cityBlockIndex > selectedBlockIndex, 'City context should render after selected-building block.');
  assert.ok(supportNoteIndex > cityBlockIndex, 'Support note should be tertiary after city context.');
  assert.match(worldScreen, /onClick=\{\(\) => handleRouteToModule\(selectedInspectorSubject\.moduleKey\)\}/);
  const inspectorBodyStart = worldScreen.indexOf('const worldInspectorBody = selectedCity ?');
  const inspectorBodyEnd = worldScreen.indexOf('const handleSelectCity =');
  assert.ok(inspectorBodyStart >= 0 && inspectorBodyEnd > inspectorBodyStart, 'Expected inspector body block.');
  const inspectorBodyBlock = worldScreen.slice(inspectorBodyStart, inspectorBodyEnd);
  assert.doesNotMatch(inspectorBodyBlock, /<RunCompass/);
});
