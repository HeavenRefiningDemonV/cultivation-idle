import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const root = process.cwd();

function readRepoFile(relativePath: string): string {
  return readFileSync(path.join(root, relativePath), 'utf8');
}

test('Inventory polish removes dashboard void colors and defines pocket-realm tray tokens', () => {
  const scss = readRepoFile('src/components/screens/InventoryScreen.scss');

  assert.doesNotMatch(scss, /--inv-void-/);
  assert.doesNotMatch(scss, /rgba\(2,\s*6,\s*23/);
  assert.doesNotMatch(scss, /99,\s*102,\s*241/);
  assert.doesNotMatch(scss, /168,\s*85,\s*247/);
  assert.match(scss, /--inv-pocket-ink/);
  assert.match(scss, /spatial-ring-seal/);
});

test('Technique empty state is intentional and does not use glyph-icon filter labels', () => {
  const tsx = readRepoFile('src/components/screens/TechniqueLibraryScreen.tsx');
  const scss = readRepoFile('src/components/screens/TechniqueLibraryScreen.scss');

  assert.doesNotMatch(tsx, /\u2301\s*Filters/u);
  assert.match(tsx, /techniqueLibraryEmptyStateSeal/);
  assert.match(scss, /\.techniqueLibraryEmptyState::before/);
  assert.match(scss, /min-height:\s*clamp\(220px,\s*26vh,\s*340px\)/);
});

test('Status desktop surface uses broad ledger width instead of a narrow document stack', () => {
  const scss = readRepoFile('src/ui/status/ledger/StatusLedgerPage.scss');

  assert.doesNotMatch(scss, /max-width:\s*1240px/);
  assert.match(scss, /min\(1720px,\s*calc\(100vw - clamp\(36px,\s*4\.5vw,\s*96px\)\)\)/);
  assert.match(scss, /\.statusLedgerCanvas/);
  assert.match(scss, /\.statusLedgerGrid/);
  assert.doesNotMatch(scss, /statusV2/);
  assert.doesNotMatch(scss, /statusActionStrip::before/);
});

test('World map labels use parchment seal treatment instead of raw green glow chips', () => {
  const scss = readRepoFile('src/components/screens/CityMapHub.scss');

  assert.doesNotMatch(scss, /background-color:\s*#b8e4a3/);
  assert.doesNotMatch(scss, /box-shadow:\s*0 0 10px 3px #fff/);
  assert.match(scss, /cityMapHubHotspot::before/);
  assert.match(scss, /data-cue-kind/);
});

test('Ruins scenic underpaint provides chamber identity when final plate art is deferred', () => {
  const scss = readRepoFile('src/features/world/ruinsExact/RuinsExactMockupScreen.scss');

  assert.match(scss, /ruinsScenicStage__deferredUnderpaint::before/);
  assert.match(scss, /ruinsScenicStage__deferredUnderpaint::after/);
  assert.match(scss, /hollow-root-mouth/);
});
