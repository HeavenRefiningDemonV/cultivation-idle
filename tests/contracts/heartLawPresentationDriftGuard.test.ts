import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';

const heartLawPanelSource = readFileSync('src/ui/cultivation/heartLaw/HeartLawPanel.tsx', 'utf8');
const changeHeartLawModalSource = readFileSync('src/ui/cultivation/heartLaw/ChangeHeartLawModal.tsx', 'utf8');
const lifeStartWizardSource = readFileSync('src/components/modals/LifeStartWizardModal.tsx', 'utf8');

test('HeartLawPanel consumes shared heart-law presentation source', () => {
  assert.ok(heartLawPanelSource.includes('getHeartLawSelectionPresentation'));
});

test('HeartLawPanel does not use compatibility or local doctrinal grammar paths', () => {
  assert.equal(heartLawPanelSource.includes('getAffinityStatus('), false);
  assert.equal(heartLawPanelSource.includes('archetypeLabels'), false);
  assert.equal(heartLawPanelSource.includes('signatureSummary = summarizeEffects'), false);
  assert.equal(heartLawPanelSource.includes('Resonates with your Spirit Root'), false);
});

test('ChangeHeartLawModal remains on shared presentation builder', () => {
  assert.ok(changeHeartLawModalSource.includes('getHeartLawSelectionPresentation'));
});

test('LifeStart wizard step two avoids legacy resonance synonyms', () => {
  assert.equal(lifeStartWizardSource.includes('Strong Resonance'), false);
  assert.equal(lifeStartWizardSource.includes('Resonant'), false);
  assert.equal(lifeStartWizardSource.includes('Mismatched'), false);
  assert.equal(lifeStartWizardSource.includes('Resonates with your Spirit Root'), false);
});
