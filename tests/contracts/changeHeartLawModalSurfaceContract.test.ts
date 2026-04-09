import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';

const modalSource = readFileSync('src/ui/cultivation/heartLaw/ChangeHeartLawModal.tsx', 'utf8');
const harnessSource = readFileSync('src/dev/sectionCAudit/SectionCAuditHarness.tsx', 'utf8');

test('ChangeHeartLawModal remains on RitualModalFrame and shared presentation grammar', () => {
  assert.ok(modalSource.includes('<RitualModalFrame'));
  assert.ok(modalSource.includes('getHeartLawSelectionPresentation'));
});

test('ChangeHeartLawModal keeps explicit rewrite-consequence and scripture selection regions', () => {
  assert.ok(modalSource.includes('Rewrite consequence decree'));
  assert.ok(modalSource.includes('Verse progress returns to'));
  assert.ok(modalSource.includes('change-heart-law-scripture-list'));
  assert.ok(modalSource.includes('Current Law'));
  assert.ok(modalSource.includes('Selected Law'));
});

test('ChangeHeartLawModal keeps dominant action lane and status text in DOM', () => {
  assert.ok(modalSource.includes('change-heart-law-action-lane'));
  assert.ok(modalSource.includes('change-heart-law-status'));
  assert.ok(modalSource.includes('Rewrite Heart Law'));
  assert.ok(modalSource.includes('Keep Current Law'));
});

test('Section C harness exposes change-heart-law truth-state selector for required capture states', () => {
  assert.ok(harnessSource.includes("type ChangeHeartLawAuditState = 'current' | 'affordable' | 'unaffordable' | 'locked' | 'restricted'"));
  assert.ok(harnessSource.includes('Change-law truth state'));
  assert.ok(harnessSource.includes('debugCanAffordOverride'));
  assert.ok(harnessSource.includes('debugInitialSelectedHeartLawId'));
});
