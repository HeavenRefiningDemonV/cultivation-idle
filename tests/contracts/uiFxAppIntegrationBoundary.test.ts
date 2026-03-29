import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const root = process.cwd();
const read = (relativePath: string) => fs.readFileSync(path.join(root, relativePath), 'utf8');

function listFiles(dir: string): string[] {
  return fs
    .readdirSync(path.join(root, dir))
    .flatMap((entry) => {
      const rel = path.join(dir, entry);
      const abs = path.join(root, rel);
      const stat = fs.statSync(abs);
      if (stat.isDirectory()) return listFiles(rel);
      return rel;
    })
    .filter((file) => /\.(ts|tsx)$/.test(file));
}

void test('app integration boundary: App uses provider bridge and main remains seam-agnostic', () => {
  const appSource = read('src/App.tsx');
  const mainSource = read('src/main.tsx');

  assert.match(appSource, /AppFxProviderBridge/);
  assert.doesNotMatch(mainSource, /src\/ui\/fx/);
  assert.doesNotMatch(mainSource, /src\/app\/fx/);
});

void test('app integration boundary: no screen except GameLayout imports fx seams', () => {
  listFiles('src/components/screens').forEach((filePath) => {
    const source = read(filePath);
    assert.doesNotMatch(source, /AppFxProviderBridge/);
    assert.doesNotMatch(source, /GameLayoutFxSeam/);
    if (!filePath.endsWith('SettingsScreen.tsx')) {
      assert.doesNotMatch(source, /ui\/fx\//);
    }
  });

  const gameLayoutSource = read('src/components/GameLayout.tsx');
  assert.match(gameLayoutSource, /GameLayoutFxSeam/);
});

void test('app integration boundary: no modal imports fx and scenes folder remains README-only', () => {
  listFiles('src/components/modals').forEach((filePath) => {
    assert.doesNotMatch(read(filePath), /ui\/fx\//);
  });

  const sceneFiles = fs
    .readdirSync(path.join(root, 'src/ui/fx/pixi/scenes'))
    .filter((entry) => entry !== 'README.md');

  assert.equal(sceneFiles.length, 0);
});

void test('app integration boundary: docs mention lazy portal-root policy', () => {
  const doc = read('docs/ui/app-fx-integration-seam.md');
  assert.match(doc, /lazy portal root policy/i);
});
