import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import test from 'node:test';

function read(relPath: string): string {
  return readFileSync(resolve(process.cwd(), relPath), 'utf8');
}

test('selection fx scene remains intentional null stub for PATH A', () => {
  const selectionScene = read('src/ui/fx/scenes/SelectionFxScene.tsx');
  assert.match(selectionScene, /intentionally null/);
  assert.match(selectionScene, /return null;/);
});

test('life-start path commit remains immediate under reduced motion', () => {
  const source = read('src/components/modals/LifeStartWizardModal.tsx');
  assert.match(source, /if \(prefersReducedMotion\) \{\s*commitPath\(\);\s*return;\s*\}/);
  assert.match(source, /getSelectionCommitDelay\(prefersReducedMotion\)/);
});

test('life-start path exposes explicit fx quality and reduced-motion attributes for css atmosphere tiers', () => {
  const source = read('src/components/modals/LifeStartWizardModal.tsx');
  assert.match(source, /data-fx-quality=\{effectiveQuality\}/);
  assert.match(source, /data-reduced-motion=\{prefersReducedMotion \? 'true' : 'false'\}/);
});

test('path atmosphere stylesheet defines distinct high\/low\/reduced behaviors without layout geometry mutation hooks', () => {
  const source = read('src/components/modals/LifeStartWizardModal.scss');

  assert.match(source, /data-fx-quality='high'[\s\S]*lifePathLaneBreath/);
  assert.match(source, /data-fx-quality='low'[\s\S]*lifePathTriptych::before/);
  assert.match(source, /data-fx-quality='reducedMotion'[\s\S]*animation:\s*none/);
  assert.match(source, /data-reduced-motion='true'[\s\S]*lifePathTriptych::before/);

  assert.match(source, /\.lifePathPanel__footer[\s\S]*min-height:\s*138px/);
  assert.match(source, /\.lifePathPanel__actionPlate[\s\S]*min-height:\s*72px/);
});
