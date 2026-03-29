import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const read = (rel: string) => fs.readFileSync(path.join(root, rel), 'utf8');

void test('framecard convergence: required files exist', () => {
  [
    'src/ui/chrome/FrameCard.tsx',
    'src/ui/chrome/FrameCard.scss',
    'docs/ui/section-b-framecard-convergence.md',
  ].forEach((file) => {
    assert.equal(fs.existsSync(path.join(root, file)), true, `${file} should exist`);
  });
});

void test('framecard convergence: chrome index exports FrameCard', () => {
  assert.match(read('src/ui/chrome/index.ts'), /export \{ FrameCard \} from '\.\/FrameCard\.js';/);
});

void test('framecard convergence: legacy wrappers delegate to FrameCard', () => {
  assert.match(read('src/ui/ink/InkPanel.tsx'), /from '\.\.\/chrome\/FrameCard\.js'/);
  assert.match(read('src/ui/ink/PaperCard.tsx'), /from '\.\.\/chrome\/FrameCard\.js'/);
  assert.match(read('src/ui/paper/PaperCard.tsx'), /from '\.\.\/chrome\/FrameCard\.js'/);
});

void test('framecard convergence: canonical variants and states are present', () => {
  const source = read('src/ui/chrome/FrameCard.tsx');

  ['shell', 'tray', 'label', 'inspector', 'modal', 'dock'].forEach((variant) => {
    assert.match(source, new RegExp(`'${variant}'`));
  });

  ['interactive', 'selected', 'disabled', 'complete', 'claimed', 'recommended', 'warning'].forEach((state) => {
    assert.match(source, new RegExp(state));
  });
});

void test('framecard convergence: selected state avoids border-width growth and uses non-layout emphasis', () => {
  const inkCardCompat = read('src/ui/ink/PaperCard.scss');
  const frameCardStyles = read('src/ui/chrome/FrameCard.scss');

  assert.doesNotMatch(inkCardCompat, /inkPaperCard--selected[\s\S]*\bborder-width\s*:/i);
  assert.match(frameCardStyles, /frameCard--selected[\s\S]*(box-shadow|outline|inset)/i);
});

void test('framecard convergence: legacy class family strings remain present', () => {
  assert.match(read('src/ui/ink/InkPanel.tsx'), /inkPanel/);
  assert.match(read('src/ui/ink/PaperCard.tsx'), /inkPaperCard/);
  assert.match(read('src/ui/paper/PaperCard.tsx'), /paperCard/);
});

void test('framecard convergence: no screen import migration to chrome frame card', () => {
  const screenDirs = ['src/components/screens', 'src/components/modals', 'src/features'];

  const listFiles = (dir: string): string[] =>
    fs
      .readdirSync(path.join(root, dir))
      .flatMap((entry) => {
        const rel = path.join(dir, entry);
        const abs = path.join(root, rel);
        const stat = fs.statSync(abs);
        return stat.isDirectory() ? listFiles(rel) : [rel];
      })
      .filter((file) => /\.(ts|tsx)$/.test(file));

  screenDirs.flatMap((dir) => listFiles(dir)).forEach((file) => {
    const source = read(file);
    assert.doesNotMatch(source, /ui\/chrome\/FrameCard/);
  });
});
