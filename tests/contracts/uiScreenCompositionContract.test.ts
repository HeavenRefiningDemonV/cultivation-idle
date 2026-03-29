import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const root = process.cwd();
const read = (relativePath: string) => fs.readFileSync(path.join(root, relativePath), 'utf8');

void test('screen composition contract: global styles import screen composition stylesheet', () => {
  const globalStyle = read('src/styles/global.css');
  assert.match(globalStyle, /@import '\.\/uiScreenComposition\.scss';/);
});

void test('screen composition contract: slot classes exist and use local layer tokens', () => {
  const source = read('src/styles/uiScreenComposition.scss');

  [
    '.uiScreenCompositionRoot',
    '.uiScreenCompositionBackdrop',
    '.uiScreenCompositionTexture',
    '.uiScreenCompositionFxUnderlay',
    '.uiScreenCompositionContent',
    '.uiScreenCompositionHeroFx',
    '.uiScreenCompositionContentOverlay',
  ].forEach((token) => {
    assert.match(source, new RegExp(`\\${token}`));
  });

  [
    '--ui-layer-local-backdrop',
    '--ui-layer-local-texture',
    '--ui-layer-local-fx-underlay',
    '--ui-layer-local-content',
    '--ui-layer-local-fx-hero',
    '--ui-layer-local-content-overlay',
  ].forEach((token) => {
    assert.match(source, new RegExp(token));
  });
});

void test('screen composition contract: packet docs and readme mention A.8 contract', () => {
  const architectureDoc = read('docs/ui/fx-architecture-shell.md');
  const packetDoc = read('docs/ui/screen-composition-layer-contract.md');
  const fxReadme = read('src/ui/fx/README.md');

  assert.match(architectureDoc, /A\.8 screen composition contract update/);
  assert.match(packetDoc, /Packet A\.8 — Screen Composition Layer Contract/);
  assert.match(fxReadme, /What A\.8 adds/);
});
