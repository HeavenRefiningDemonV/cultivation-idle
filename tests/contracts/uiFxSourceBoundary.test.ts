import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const root = process.cwd();
const read = (relativePath: string) => fs.readFileSync(path.join(root, relativePath), 'utf8');

const shouldNotImportUiFx = [
  'src/main.tsx',
  'src/App.tsx',
  'src/components/GameLayout.tsx',
  'src/components/screens/CultivateScreen.tsx',
  'src/components/screens/StatusScreen.tsx',
  'src/components/screens/WorldScreen.tsx',
] as const;

void test('ui fx source boundary: app and screens do not import ui/fx', () => {
  shouldNotImportUiFx.forEach((filePath) => {
    const source = read(filePath);
    assert.doesNotMatch(source, /ui\/fx/);
  });
});

void test('ui fx source boundary: scaffold files remain store-agnostic', () => {
  const providerSource = read('src/ui/fx/FxQualityProvider.tsx');
  const screenFxStateSource = read('src/ui/fx/pixi/hooks/useScreenFxState.ts');

  assert.doesNotMatch(providerSource, /stores\//);
  assert.doesNotMatch(screenFxStateSource, /stores\//);
});

void test('ui fx source boundary: screen stage defaults to pointer-events none', () => {
  const source = read('src/ui/fx/ScreenFxStage.tsx');
  const styleSource = read('src/ui/fx/ScreenFxStage.scss');

  assert.match(styleSource, /pointer-events:\s*none/);
  assert.match(source, /screenFxStage/);
});
