import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

function read(relPath: string): string {
  return readFileSync(resolve(process.cwd(), relPath), 'utf8');
}

test('WorldScreen centralizes inspector fallback breakpoint and keeps wide/narrow inspector paths', () => {
  const file = read('src/components/screens/WorldScreen.tsx');
  assert.match(file, /WORLD_INSPECTOR_NARROW_QUERY = '\(max-width: 1180px\)'/);
  assert.match(file, /<InspectorPanel/);
  assert.match(file, /<InspectorDrawer/);
});

test('WorldScreen uses a shared world inspector body for both wide and narrow paths', () => {
  const file = read('src/components/screens/WorldScreen.tsx');
  assert.match(file, /const worldInspectorBody = selectedCity \?/);
  assert.match(file, /const worldCommandBandCitySummary = selectedCity \?/);
  assert.match(file, /const selectedInspectorSubject = useMemo\(\(\) =>/);
  const occurrences = Array.from(file.matchAll(/\{worldInspectorBody\}/g)).length;
  assert.equal(occurrences, 2, 'worldInspectorBody should be rendered in wide and narrow inspector paths');
});

test('WorldScreen preserves map-owns-page composition with subordinate command deck and shared inspector architecture', () => {
  const file = read('src/components/screens/WorldScreen.tsx');
  assert.match(file, /worldScreenHubPanel/);
  assert.match(file, /worldCommandDeck worldCommandDeck--subordinate/);
  assert.match(file, /worldScreenInspectorRegion/);
});

test('Narrow world drawer removes duplicate visible title ownership while keeping InspectorPanel hierarchy', () => {
  const file = read('src/components/screens/WorldScreen.tsx');
  assert.match(file, /title="World Details"/);
  assert.match(file, /headerMode="close-only"/);
  assert.match(file, /title="World Details"/);
});

test('World inspector selected-building anatomy is first-class and routes directly to selected module', () => {
  const file = read('src/components/screens/WorldScreen.tsx');
  assert.match(file, /const cards = worldCommandSurface\.groups\.flatMap\(\(group\) => group\.cards\)/);
  assert.match(file, /Selected building/);
  assert.match(file, /worldCommandSummary--selectedModule/);
  assert.match(file, /worldCommandSummaryLine--primary/);
  assert.match(file, /worldCommandSummaryOutputs/);
  assert.match(file, /onClick=\{\(\) => handleRouteToModule\(selectedInspectorSubject\.moduleKey\)\}/);
});

test('World inspector keeps alerts as secondary support surfaces', () => {
  const file = read('src/components/screens/WorldScreen.tsx');
  assert.match(file, /Shortcut alerts stay in the command band above the map\./);
  assert.match(file, /worldScreenCommandBand/);
  assert.match(file, /aria-label="World support alerts"/);
});

test('World inspector no longer owns the full RunCompass surface', () => {
  const file = read('src/components/screens/WorldScreen.tsx');
  const inspectorBodyStart = file.indexOf('const worldInspectorBody = selectedCity ?');
  const inspectorBodyEnd = file.indexOf('const handleSelectCity =');
  assert.ok(inspectorBodyStart >= 0 && inspectorBodyEnd > inspectorBodyStart, 'Expected world inspector body block in WorldScreen');
  const inspectorBodyBlock = file.slice(inspectorBodyStart, inspectorBodyEnd);
  assert.doesNotMatch(inspectorBodyBlock, /<RunCompass/);
  assert.match(file, /<section className="worldScreenCommandBand" aria-label="World command band">/);
});

test('World inspector keeps selected-building first and city context secondary in shared body', () => {
  const file = read('src/components/screens/WorldScreen.tsx');
  const selectedIndex = file.indexOf('worldCommandSummary--selectedModule');
  const cityIndex = file.indexOf('worldCommandSummary--cityContextSecondary');
  assert.ok(selectedIndex >= 0 && cityIndex > selectedIndex, 'selected-building block should render before city context');
  assert.match(file, /density="compact"/);
  assert.match(file, /emptyZoneBehavior="collapse"/);
});

test('WorldScreen resolves city support identity labels from the city package registry source of truth', () => {
  const file = read('src/components/screens/WorldScreen.tsx');
  assert.match(file, /getSupportIdentityLabel/);
  assert.doesNotMatch(file, /systems\/ui\/world\/worldCommandSurface\.js/);
});

test('World city selector exposes locked requirements in-chip and keeps locked entries keyboard-reviewable', () => {
  const file = read('src/components/screens/WorldScreen.tsx');
  assert.match(file, /aria-disabled=\{!isUnlocked \? 'true' : undefined\}/);
  assert.doesNotMatch(file, /Progress required/);
});

test('No new inspector consumers were added outside the world proof surface', () => {
  const liveLayout = read('src/components/GameLayout.tsx');
  assert.doesNotMatch(liveLayout, /InspectorPanel/);
  assert.doesNotMatch(liveLayout, /InspectorDrawer/);
});
