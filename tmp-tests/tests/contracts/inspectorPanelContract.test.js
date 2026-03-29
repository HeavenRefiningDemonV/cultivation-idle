import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

const root = process.cwd();
const read = (rel) => fs.readFileSync(path.join(root, rel), 'utf8');
const exists = (rel) => fs.existsSync(path.join(root, rel));

void test('inspector panel contract: required artifacts exist', () => {
  [
    'src/ui/chrome/InspectorPanel.tsx',
    'src/ui/chrome/InspectorPanel.scss',
    'docs/ui/section-b-inspector-panel.md',
  ].forEach((rel) => assert.equal(exists(rel), true, `${rel} should exist`));
});

void test('inspector panel contract: chrome index exports InspectorPanel', () => {
  assert.match(read('src/ui/chrome/index.ts'), /export\s*\{\s*InspectorPanel\s*\}/);
});

void test('inspector panel contract: InspectorPanel uses FrameCard inspector variant', () => {
  const source = read('src/ui/chrome/InspectorPanel.tsx');
  assert.match(source, /FrameCard/);
  assert.match(source, /variant="inspector"/);
});

void test('inspector panel contract: WorldScreen adopts InspectorPanel', () => {
  const source = read('src/components/screens/WorldScreen.tsx');
  assert.match(source, /InspectorPanel/);
  assert.match(source, /worldInspectorDock/);
});

void test('inspector panel contract: TechniqueLibraryScreen adopts InspectorPanel', () => {
  const source = read('src/components/screens/TechniqueLibraryScreen.tsx');
  assert.match(source, /InspectorPanel/);
  assert.match(source, /techInspectorDock/);
});

void test('inspector panel contract: ManualPavilionPanel adopts InspectorPanel', () => {
  const source = read('src/components/screens/ManualPavilionPanel.tsx');
  assert.match(source, /InspectorPanel/);
  assert.match(source, /manualPavilionInspectorDock/);
});

void test('inspector panel contract: world preview callback hooks exist on map and card', () => {
  const mapSource = read('src/components/screens/CityMapHub.tsx');
  const cardSource = read('src/ui/world/WorldModuleCard.tsx');
  assert.match(mapSource, /onPreviewModule/);
  assert.match(cardSource, /onPreview/);
});

void test('inspector panel contract: canonical styles define required inspector selectors', () => {
  const source = read('src/ui/chrome/InspectorPanel.scss');
  assert.match(source, /\.inspectorPanel\b/);
  assert.match(source, /\.inspectorPanel__body\b/);
  assert.match(source, /\.inspectorPanel__footer\b/);
});

void test('inspector panel contract: WorldBuildingModal remains modal surface', () => {
  const source = read('src/components/modals/WorldBuildingModal.tsx');
  assert.doesNotMatch(source, /InspectorPanel/);
  assert.match(source, /Modal/);
});

void test('inspector panel contract: no new art files added for B.8', () => {
  const diff = execSync('git diff --name-status HEAD', { cwd: root, encoding: 'utf8' });
  const addedAssetFile = diff
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .some((line) => line.startsWith('A') && /src\/assets\/.+\.(png|jpg|jpeg|webp|gif|svg|avif)$/i.test(line));
  assert.equal(addedAssetFile, false, 'B.8 should not add new art files');
});
