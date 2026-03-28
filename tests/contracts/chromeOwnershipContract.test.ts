import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const read = (rel: string) => fs.readFileSync(path.join(root, rel), 'utf8');

const CHROME_EXPORTS = [
  'FrameCard',
  'ChromeChip',
  'ChromeStamp',
  'InspectorPanel',
  'ModalFrame',
  'PlaqueHeader',
  'BottomNavDock',
  'TopRibbon',
  'SelectionHalo',
  'ScenicLabel',
];

void test('chrome ownership: canonical chrome index exports required public names', () => {
  const source = read('src/ui/chrome/index.ts');

  CHROME_EXPORTS.forEach((name) => {
    assert.match(source, new RegExp(`export \\{ ${name} \\} from`));
  });
});

void test('chrome ownership: section-b ownership doc exists', () => {
  const docPath = path.join(root, 'docs/ui/section-b-chrome-ownership.md');
  assert.equal(fs.existsSync(docPath), true);
});

void test('chrome ownership: no chrome component imports both legacy ink and legacy paper families', () => {
  const chromeDir = path.join(root, 'src/ui/chrome');
  const files = fs.readdirSync(chromeDir).filter((entry) => entry.endsWith('.ts') || entry.endsWith('.tsx'));

  files.forEach((fileName) => {
    const source = fs.readFileSync(path.join(chromeDir, fileName), 'utf8');
    const importsInk = /from ['"]\.\.\/ink\//.test(source);
    const importsPaper = /from ['"]\.\.\/paper\//.test(source);

    assert.equal(
      importsInk && importsPaper,
      false,
      `${fileName} imports both ui/ink and ui/paper; B.1 requires one legacy backing family per wrapper`,
    );
  });
});

void test('chrome ownership: barrel remains a stable side-effect-free public surface', () => {
  const source = read('src/ui/chrome/index.ts');
  assert.doesNotMatch(source, /console\.|document\.|window\./);
  assert.doesNotMatch(source, /class\s+/);
});
