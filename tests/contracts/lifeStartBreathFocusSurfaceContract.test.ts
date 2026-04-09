import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';

const wizardSource = readFileSync('src/components/modals/LifeStartWizardModal.tsx', 'utf8');

test('step 3 breath focus remains owned by LifeStartWizardModal and uses breath semantics helper', () => {
  assert.ok(wizardSource.includes('wizardStep === 3'));
  assert.ok(wizardSource.includes('getBreathModeSemantics'));
});

test('step 3 uses dedicated breath shell markers instead of generic card-grid-only treatment', () => {
  assert.ok(wizardSource.includes('lifeStartBreathShell'));
  assert.ok(wizardSource.includes('data-ui="life-start-breath-focus-shell"'));
  assert.ok(wizardSource.includes('lifeStartBreathChoicesGrid'));
  assert.ok(wizardSource.includes('lifeStartBreathDetail'));
});

test('step 3 renders semantic explanatory detail and finish action within the breath-focus surface', () => {
  assert.ok(wizardSource.includes('draftBreathSemantics.summary'));
  assert.ok(wizardSource.includes('draftBreathSemantics.preferredFor'));
  assert.ok(wizardSource.includes('draftBreathSemantics.cautions'));
  assert.ok(wizardSource.includes('lifeStartBreathDetail__ctaLane'));
  assert.ok(wizardSource.includes('onClick={handleFinish}'));
});
