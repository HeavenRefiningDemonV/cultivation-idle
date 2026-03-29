import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const root = process.cwd();
const read = (relativePath: string) => fs.readFileSync(path.join(root, relativePath), 'utf8');

function listFiles(dir: string): string[] {
  const absolute = path.join(root, dir);
  return fs
    .readdirSync(absolute)
    .flatMap((entry) => {
      const rel = path.join(dir, entry);
      const abs = path.join(root, rel);
      const stat = fs.statSync(abs);
      if (stat.isDirectory()) {
        return listFiles(rel);
      }
      return rel;
    })
    .filter((file) => /\.(ts|tsx)$/.test(file));
}

void test('fx no-screen-coupling: screens and modals do not import fx primitives/motion', () => {
  const screenFiles = listFiles('src/components/screens');
  const modalFiles = listFiles('src/components/modals');

  [...screenFiles, ...modalFiles].forEach((filePath) => {
    const source = read(filePath);
    assert.doesNotMatch(source, /ui\/fx\/primitives/);
    assert.doesNotMatch(source, /ui\/fx\/motion/);
  });
});

void test('fx no-screen-coupling: primitives and motion remain store-agnostic', () => {
  [...listFiles('src/ui/fx/primitives'), ...listFiles('src/ui/fx/motion')].forEach((filePath) => {
    const source = read(filePath);
    assert.doesNotMatch(source, /stores\//);
  });
});

void test('fx no-screen-coupling: motion wrappers never import pixi', () => {
  listFiles('src/ui/fx/motion').forEach((filePath) => {
    const source = read(filePath);
    assert.doesNotMatch(source, /pixi/i);
    assert.doesNotMatch(source, /@pixi/);
  });
});

void test('fx no-screen-coupling: only ambient underlay and hero slot import PixiUiStage', () => {
  const files = listFiles('src/ui/fx/primitives');

  files.forEach((filePath) => {
    const source = read(filePath);
    const importsPixiUiStage = /PixiUiStage/.test(source);

    if (importsPixiUiStage) {
      assert.match(filePath, /(AmbientUnderlayMount|HeroFxSlot)\.tsx$/);
    }
  });
});

void test('fx no-screen-coupling: scenic backdrop and safe overlay are DOM-only', () => {
  const scenic = read('src/ui/fx/primitives/ScenicBackdropMount.tsx');
  const overlay = read('src/ui/fx/primitives/SafeDomOverlaySlot.tsx');

  assert.doesNotMatch(scenic, /framer-motion/);
  assert.doesNotMatch(scenic, /PixiUiStage/);

  assert.doesNotMatch(overlay, /framer-motion/);
  assert.doesNotMatch(overlay, /PixiUiStage/);
});
