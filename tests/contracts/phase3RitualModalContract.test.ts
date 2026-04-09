import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';

const contractDoc = readFileSync('docs/ui/phase-3-ritual-modal-contract.md', 'utf8');
const ritualFrameSource = readFileSync('src/ui/shell/RitualModalFrame.tsx', 'utf8');


test('phase-3 ritual contract references p2-09 lineage and live ritual proof consumers', () => {
  assert.ok(contractDoc.includes('docs/ui/phase-2-p2-09-ritual-modal-contract.md'));
  assert.ok(contractDoc.includes('PrestigeRitualModal'));
  assert.ok(contractDoc.includes('CurrentChapterExhaustedModal'));
  assert.ok(contractDoc.includes('LifeSummaryModal'));
  assert.ok(contractDoc.includes('ChangeHeartLawModal'));
});

test('phase-3 ritual contract defines semantic ritual uses and DOM-truth guarantees', () => {
  assert.ok(contractDoc.includes('Choice / consequence ritual'));
  assert.ok(contractDoc.includes('Warning / chapter-end ritual'));
  assert.ok(contractDoc.includes('Summary / review ritual'));
  assert.ok(contractDoc.includes('must remain in the DOM'));
  assert.ok(contractDoc.includes('cost truth'));
  assert.ok(contractDoc.includes('status/helper lines'));
});

test('RitualModalFrame keeps InkModalFrame ownership and stable ritual zone markers', () => {
  assert.ok(ritualFrameSource.includes('<InkModalFrame'));
  assert.ok(ritualFrameSource.includes('data-ritual-zone="header"'));
  assert.ok(ritualFrameSource.includes('data-ritual-zone="ornament"'));
  assert.ok(ritualFrameSource.includes('data-ritual-zone="reading"'));
  assert.ok(ritualFrameSource.includes('data-ritual-zone="action-band"'));
});
