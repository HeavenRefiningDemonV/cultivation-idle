import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

const root = process.cwd();
const read = (rel) => fs.readFileSync(path.join(root, rel), 'utf8');
const exists = (rel) => fs.existsSync(path.join(root, rel));

void test('modal frame contract: required artifacts exist', () => {
  [
    'src/ui/chrome/ModalFrame.tsx',
    'src/ui/chrome/ModalFrame.scss',
    'docs/ui/section-b-modal-frame.md',
  ].forEach((rel) => assert.equal(exists(rel), true, `${rel} should exist`));
});

void test('modal frame contract: chrome index exports ModalFrame', () => {
  assert.match(read('src/ui/chrome/index.ts'), /export\s*\{\s*ModalFrame\s*\}/);
});

void test('modal frame contract: InkModalFrame delegates to ModalFrame', () => {
  const source = read('src/ui/ink/InkModalFrame.tsx');
  assert.match(source, /ModalFrame/);
  assert.match(source, /surface="frame"/);
});

void test('modal frame contract: DetailScrollModal uses ModalFrame', () => {
  const source = read('src/ui/primitives/DetailScrollModal.tsx');
  assert.match(source, /ModalFrame/);
  assert.match(source, /kind="detail"/);
});

void test('modal frame contract: target modal surfaces use ModalFrame', () => {
  [
    'src/components/modals/CurrentChapterExhaustedModal.tsx',
    'src/components/modals/LifeSummaryModal.tsx',
    'src/components/modals/WorldBuildingModal.tsx',
    'src/components/modals/DaoHeartModal.tsx',
  ].forEach((rel) => {
    const source = read(rel);
    assert.match(source, /ModalFrame/);
  });
});

void test('modal frame contract: ModalFrame.scss has required selectors', () => {
  const source = read('src/ui/chrome/ModalFrame.scss');
  assert.match(source, /\.modalFrame\b/);
  assert.match(source, /\.modalFrame--detail\b/);
  assert.match(source, /\.modalFrame--feature\b/);
  assert.match(source, /\.modalFrame--blocking\b/);
});

void test('modal frame contract: removed raw z-index targets in touched shell files', () => {
  assert.doesNotMatch(read('src/ui/ink/InkModalFrame.scss'), /z-index:\s*80/);
  assert.doesNotMatch(read('src/ui/primitives/DetailScrollModal.scss'), /z-index:\s*2200/);
  assert.doesNotMatch(read('src/components/modals/WorldBuildingModal.scss'), /z-index:\s*2100/);
  assert.doesNotMatch(read('src/components/modals/CurrentChapterExhaustedModal.scss'), /z-index:\s*1500/);
  assert.doesNotMatch(read('src/components/modals/LifeSummaryModal.scss'), /z-index:\s*1550/);
  assert.doesNotMatch(read('src/components/modals/MedicinePouchModal.scss'), /z-index:\s*2400/);
  assert.doesNotMatch(read('src/components/modals/DaoHeartModal.scss'), /z-index:\s*48/);
});

void test('modal frame contract: LifeStartWizard and MedicinePouch pass modal kind classification', () => {
  assert.match(read('src/components/modals/LifeStartWizardModal.tsx'), /modalKind="blocking"/);
  assert.match(read('src/components/modals/MedicinePouchModal.tsx'), /modalKind="detail"/);
});

void test('modal frame contract: no new art files added for B.9', () => {
  const diff = execSync('git diff --name-status HEAD', { cwd: root, encoding: 'utf8' });
  const addedAssetFile = diff
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .some((line) => line.startsWith('A') && /src\/assets\/.+\.(png|jpg|jpeg|webp|gif|svg|avif)$/i.test(line));
  assert.equal(addedAssetFile, false, 'B.9 should not add new art files');
});
