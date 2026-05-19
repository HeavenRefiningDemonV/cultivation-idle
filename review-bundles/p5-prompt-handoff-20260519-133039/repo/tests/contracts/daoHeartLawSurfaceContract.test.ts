import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';

const modalSource = readFileSync('src/components/modals/DaoHeartModal.tsx', 'utf8');
const mindViewSource = readFileSync('src/ui/cultivation/heartLaw/HeartLawMindView.tsx', 'utf8');

test('DaoHeartModal still owns live tab scaffold and keeps heartLaw tab selectable', () => {
  assert.ok(modalSource.includes("role=\"tablist\""));
  assert.ok(modalSource.includes("id=\"dao-heart-tab-heart-law\""));
  assert.ok(modalSource.includes("setTab('heartLaw')"));
});

test('heartLaw tab mounts one primary ritual owner and does not fallback to HeartLawPanel', () => {
  assert.ok(modalSource.includes('<HeartLawMindView />'));
  assert.equal(modalSource.includes('<HeartLawPanel />'), false);
});

test('live heart-law tab path uses radial mind language and grouped reading truth in DOM', () => {
  assert.ok(mindViewSource.includes('RadialVerseRing'));
  assert.ok(mindViewSource.includes('Resonance:'));
  assert.ok(mindViewSource.includes('Comprehension'));
  assert.ok(mindViewSource.includes('Estimated time:'));
  assert.ok(mindViewSource.includes('Change Heart Law'));
  assert.ok(mindViewSource.includes('getHeartLawSelectionPresentation'));
});

test('live heart-law owner does not use compatibility-era resonance wording helper', () => {
  assert.equal(mindViewSource.includes('getAffinityStatus('), false);
});
