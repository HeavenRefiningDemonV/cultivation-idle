import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

const ROOT = process.cwd();

const read = (filePath) => fs.readFileSync(path.join(ROOT, filePath), 'utf8');
const exists = (filePath) => fs.existsSync(path.join(ROOT, filePath));

test('B.10 files exist', () => {
  [
    'src/ui/chrome/SelectionHalo.tsx',
    'src/ui/chrome/SelectionHalo.scss',
    'src/ui/chrome/ScenicLabel.tsx',
    'src/ui/chrome/ScenicLabel.scss',
    'src/ui/chrome/OverlaySwash.tsx',
    'src/ui/chrome/OverlaySwash.scss',
    'docs/ui/section-b-selection-halo-scenic-label.md',
  ].forEach((filePath) => assert.equal(exists(filePath), true, `${filePath} should exist`));
});

test('chrome index exports SelectionHalo, ScenicLabel, OverlaySwash', () => {
  const text = read('src/ui/chrome/index.ts');
  assert.match(text, /SelectionHalo/);
  assert.match(text, /ScenicLabel/);
  assert.match(text, /OverlaySwash/);
});

test('SelectionHalo ties into motion safety', () => {
  const text = read('src/ui/chrome/SelectionHalo.tsx');
  assert.ok(text.includes('useMotionSafety') || text.includes('MotionSafeSelectionSurface'));
});

test('chrome accent assets expose required legacy accents', () => {
  const text = read('src/ui/chrome/chromeAccentAssets.ts');
  assert.match(text, /bar_short\.png/);
  assert.match(text, /block_fancy\.png/);
  assert.match(text, /buttoncorners\.png/);
});

test('CityMapHub adopts ScenicLabel + SelectionHalo', () => {
  const text = read('src/components/screens/CityMapHub.tsx');
  assert.match(text, /ScenicLabel/);
  assert.match(text, /SelectionHalo/);
});

test('LifeStartWizardModal adopts SelectionHalo + OverlaySwash', () => {
  const text = read('src/components/modals/LifeStartWizardModal.tsx');
  assert.match(text, /SelectionHalo/);
  assert.match(text, /OverlaySwash/);
});

test('ChangeHeartLawModal adopts SelectionHalo', () => {
  const text = read('src/ui/cultivation/heartLaw/ChangeHeartLawModal.tsx');
  assert.match(text, /SelectionHalo/);
});

test('World module surface adopts OverlaySwash', () => {
  const cardText = read('src/ui/world/WorldModuleCard.tsx');
  const screenText = read('src/components/screens/WorldScreen.tsx');
  assert.ok(cardText.includes('OverlaySwash') || screenText.includes('OverlaySwash'));
});

test('canonical scss class families exist', () => {
  assert.match(read('src/ui/chrome/SelectionHalo.scss'), /\.selectionHalo/);
  assert.match(read('src/ui/chrome/ScenicLabel.scss'), /\.scenicLabel/);
  assert.match(read('src/ui/chrome/OverlaySwash.scss'), /\.overlaySwash/);
});

test('LifeStartWizardModal selected pseudo-element is no longer sole owner', () => {
  const text = read('src/components/modals/LifeStartWizardModal.scss');
  assert.doesNotMatch(text, /\.wizardCard--selected::after/);
});

test('no new image assets were introduced in this packet', () => {
  const changed = execSync('git status --short', { cwd: ROOT, encoding: 'utf8' })
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => line.slice(3));
  const imageAdds = changed.filter((filePath) => /\.(png|jpe?g|webp|gif|svg)$/i.test(filePath));
  assert.deepEqual(imageAdds, []);
});
