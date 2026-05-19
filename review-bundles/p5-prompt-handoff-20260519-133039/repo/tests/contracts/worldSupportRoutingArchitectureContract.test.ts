import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

function read(relPath: string): string {
  return readFileSync(resolve(process.cwd(), relPath), 'utf8');
}

test('WR-05 renders one support-routing rail with grouped cards and no disclosure deck owner', () => {
  const worldScreen = read('src/components/screens/WorldScreen.tsx');

  assert.match(worldScreen, /worldScreenSupportSlot/);
  assert.match(worldScreen, /worldSupportRail/);
  assert.match(worldScreen, /variant="support-rail"/);
  assert.doesNotMatch(worldScreen, /worldCommandDeckDisclosure/);
  assert.doesNotMatch(worldScreen, /Show module routing deck/);
});

test('WR-05 support-routing rail keeps command band and dock separation classes', () => {
  const worldScreen = read('src/components/screens/WorldScreen.tsx');
  assert.match(worldScreen, /worldScreenCommandBand/);
  assert.match(worldScreen, /worldScreenSupportSlot/);
  const commandBandIndex = worldScreen.indexOf('worldScreenCommandBand');
  const supportSlotIndex = worldScreen.indexOf('worldScreenSupportSlot');
  assert.ok(commandBandIndex >= 0 && supportSlotIndex > commandBandIndex, 'support rail should remain below command band');
});
