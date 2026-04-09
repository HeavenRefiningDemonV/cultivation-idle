import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import test from 'node:test';

function read(relPath: string): string {
  return readFileSync(resolve(process.cwd(), relPath), 'utf8');
}

void test('step 1 path selection remains owned by LifeStartWizardModal and selectedPath gate', () => {
  const source = read('src/components/modals/LifeStartWizardModal.tsx');

  assert.match(source, /selectedPath === null/);
  assert.match(source, /wizardStep === 1/);
  assert.match(source, /data-ui="life-path-fullscreen"/);
  assert.match(source, /data-ui="life-path-triptych"/);
});

void test('step 1 uses unified active presentation path and doctrine presentation source', () => {
  const source = read('src/components/modals/LifeStartWizardModal.tsx');

  assert.match(source, /const activePresentationPath: CultivationPath = hoveredPath \?\? committingPath \?\? selectedPath \?\? 'heaven'/);
  assert.match(source, /const activePresentation = getPathDoctrinePresentation\(activePresentationPath\)/);
  assert.match(source, /lifePathTriptychRail--\$\{activePresentationPath\}/);
  assert.match(source, /activePresentation\?\.summary/);
  assert.equal(source.includes('PathSelectionModal'), false);
});

void test('path surface keeps triptych-owned attached summary rail and no-layout-shift reservations', () => {
  const source = read('src/components/modals/LifeStartWizardModal.scss');

  assert.match(source, /\.lifePathTriptychFrame[\s\S]*grid-template-rows: auto minmax\(0, 1fr\);/);
  assert.match(source, /\.lifePathTriptychRail[\s\S]*min-height: 148px/);
  assert.match(source, /\.lifePathPreviewPlaque[\s\S]*min-height: 148px/);
  assert.match(source, /\.lifePathPanel__actionPlate[\s\S]*min-height: 72px/);
  assert.match(source, /\.lifePathPanel__footer[\s\S]*min-height: 138px/);
});
