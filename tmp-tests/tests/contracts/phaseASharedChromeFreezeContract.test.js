import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const read = (relPath) => fs.readFileSync(path.join(root, relPath), 'utf8');

void test('A.3 required files exist', () => {
  [
    'docs/ui/phase-a-shared-chrome-freeze.md',
    'src/styles/uiAssetContinuityGuards.scss',
  ].forEach((relPath) => {
    assert.equal(fs.existsSync(path.join(root, relPath)), true, `${relPath} should exist`);
  });
});

void test('global styles import continuity guards', () => {
  const source = read('src/styles/global.css');
  assert.match(source, /uiAssetContinuityGuards\.scss/);
});

void test('continuity guards define required additive class family', () => {
  const source = read('src/styles/uiAssetContinuityGuards.scss');
  [
    '.uiScenicBaseHost',
    '.uiScenicBasePlane',
    '.uiChromeOverlaySurface',
    '.uiChromeDoNotFlatten',
  ].forEach((marker) => assert.match(source, new RegExp(`\\${marker}`)));
});

void test('composition primitives expose scenic host/base semantics', () => {
  assert.match(read('src/ui/fx/primitives/ScreenCompositionRoot.tsx'), /uiScenicBaseHost/);
  assert.match(read('src/ui/fx/primitives/ScenicBackdropMount.tsx'), /uiScenicBasePlane/);
});

void test('shared shells advertise additive local chrome semantics', () => {
  const inkPanel = read('src/ui/ink/InkPanel.tsx');
  assert.match(inkPanel, /uiChromeOverlaySurface/);
  assert.match(inkPanel, /data-ui-chrome-surface/);

  const inkCard = read('src/ui/ink/PaperCard.tsx');
  const paperCard = read('src/ui/paper/PaperCard.tsx');
  [inkCard, paperCard].forEach((source) => {
    assert.match(source, /uiChromeOverlaySurface/);
    assert.match(source, /data-ui-chrome-surface/);
    assert.match(source, /data-preserve-base-art/);
  });
});

void test('legacy root class families remain present', () => {
  assert.match(read('src/ui/ink/InkPanel.tsx'), /inkPanel/);
  assert.match(read('src/ui/ink/PaperCard.tsx'), /inkPaperCard/);
  assert.match(read('src/ui/paper/PaperCard.tsx'), /paperCard/);
  assert.match(read('src/ui/ink/PaperChip.tsx'), /inkPaperChip/);
  assert.match(read('src/ui/paper/PaperChip.tsx'), /paperChip/);
  assert.match(read('src/ui/paper/PaperStamp.tsx'), /paperStamp/);
  assert.match(read('src/ui/ink/InkModalFrame.tsx'), /inkModalFrame/);
});

void test('A.3 did not create a speculative new ui/chrome runtime tree', () => {
  const hasA3RuntimeChromeFolder = fs.existsSync(path.join(root, 'src/ui/chrome_a3_runtime'));
  assert.equal(hasA3RuntimeChromeFolder, false);
});

void test('freeze doc contains mandatory sections', () => {
  const source = read('docs/ui/phase-a-shared-chrome-freeze.md');
  [
    'What “Freeze” Means',
    'Allowed Shared Chrome Behavior',
    'Prohibited Shared Chrome Behavior',
    'Layer Contract',
  ].forEach((marker) => assert.match(source, new RegExp(marker)));
});
