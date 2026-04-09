import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import test from 'node:test';

function read(relPath: string): string {
  return readFileSync(resolve(process.cwd(), relPath), 'utf8');
}

test('life-start step 3 remains in wizard owner and uses a dedicated breath shell', () => {
  const source = read('src/components/modals/LifeStartWizardModal.tsx');

  assert.match(source, /wizardStep === 3/);
  assert.match(source, /data-ui="life-start-breath-focus-shell"/);
  assert.match(source, /data-ui="life-start-breath-focus-selection-region"/);
  assert.match(source, /data-ui="life-start-breath-focus-detail-region"/);
  assert.equal(source.includes('PathSelectionModal'), false);
});

test('step 3 uses breath semantics for detailed meaning and keeps finish action in step shell', () => {
  const source = read('src/components/modals/LifeStartWizardModal.tsx');

  assert.match(source, /getBreathModeSemantics/);
  assert.match(source, /breathSemantics\.summary/);
  assert.match(source, /breathSemantics\.preferredFor/);
  assert.match(source, /breathSemantics\.cautions\[0\]/);
  assert.match(source, /Finish with \{breathSemantics\.label\}/);
});
