import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import test from 'node:test';

function read(relPath: string): string {
  return readFileSync(resolve(process.cwd(), relPath), 'utf8');
}

test('life-start step 2 keeps dedicated shell with selection and detail regions', () => {
  const source = read('src/components/modals/LifeStartWizardModal.tsx');

  assert.match(source, /wizardStep === 2/);
  assert.match(source, /data-ui="life-start-heart-law-shell"/);
  assert.match(source, /data-ui="life-start-heart-law-selection-region"/);
  assert.match(source, /data-ui="life-start-heart-law-detail-region"/);
});

test('step 2 still uses shared heart-law selection presentation helper and in-place detail updates', () => {
  const source = read('src/components/modals/LifeStartWizardModal.tsx');

  assert.match(source, /getHeartLawSelectionPresentation/);
  assert.match(source, /resonanceLabel/);
  assert.match(source, /previewPresentationCard\?\.roleLine/);
  assert.equal(source.includes('PathSelectionModal'), false);
});

test('sacred preview anchor remains integrated in detail pane and surface is not cards-only', () => {
  const source = read('src/components/modals/LifeStartWizardModal.tsx');

  assert.match(source, /data-ui="life-start-heart-law-sacred-anchor"/);
  assert.match(source, /lifeStartHeartLawDetail__anchor/);
  assert.equal(source.includes('wizardCardGrid--heartLaws'), false);
});
