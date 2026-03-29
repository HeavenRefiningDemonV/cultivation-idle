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
    .filter((file) => /\.(ts|tsx|md)$/.test(file));
}

void test('fx emitter boundary: no screen/modal imports emitter vocabulary', () => {
  [...listFiles('src/components/screens'), ...listFiles('src/components/modals')]
    .filter((file) => /\.tsx?$/.test(file))
    .forEach((filePath) => {
      const source = read(filePath);
      assert.doesNotMatch(source, /ui\/fx\/pixi\/emitters/);
    });
});

void test('fx emitter boundary: emitters are store-free, pixi-free, and screen-free', () => {
  listFiles('src/ui/fx/pixi/emitters')
    .filter((file) => /\.tsx?$/.test(file))
    .forEach((filePath) => {
      const source = read(filePath);
      assert.doesNotMatch(source, /stores\//);
      assert.doesNotMatch(source, /@pixi/);
      assert.doesNotMatch(source, /from\s+['"].*pixi/i);
      assert.doesNotMatch(source, /components\/screens/);
    });
});

void test('fx emitter boundary: docs mention later scene usage and no runtime screen coupling', () => {
  const doc = read('docs/ui/fx-emitter-vocabulary.md');
  assert.match(doc, /later scene packets/i);

  const readme = read('src/ui/fx/pixi/emitters/README.md');
  assert.match(readme, /Later scene packets may compose/i);
});
