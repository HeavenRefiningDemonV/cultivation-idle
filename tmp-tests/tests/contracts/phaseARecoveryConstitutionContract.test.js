import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const read = (relPath) => fs.readFileSync(path.join(root, relPath), 'utf8');

const constitutionPath = 'docs/ui/phase-a-recovery-constitution.md';
const guardrailsPath = 'docs/ui/phase-a-rollout-guardrails.md';

void test('phase A.1 docs exist', () => {
  assert.equal(fs.existsSync(path.join(root, constitutionPath)), true, `${constitutionPath} should exist`);
  assert.equal(fs.existsSync(path.join(root, guardrailsPath)), true, `${guardrailsPath} should exist`);
});

void test('recovery constitution includes required doctrine markers', () => {
  const source = read(constitutionPath);
  [
    'preservation-and-enhancement pass',
    'Asset continuity rule',
    'Preserve',
    'Enhance',
    'Create New',
    'Layer 1',
    'Layer 2',
    'Layer 3',
    'Layer 4',
    'B.1–B.3',
    'B.4–B.10',
    'B.11',
    'B.12',
  ].forEach((marker) => {
    assert.match(source, new RegExp(marker), `constitution should include marker: ${marker}`);
  });
});

void test('recovery constitution includes screen cutover gate concepts', () => {
  const source = read(constitutionPath);
  [
    'missing icons/buttons',
    'duplicate old/new headers',
    'broken composition',
    'floating cutout',
    'screenshot approved',
  ].forEach((marker) => {
    assert.match(source, new RegExp(marker), `constitution should include cutover concept: ${marker}`);
  });
});

void test('rollout guardrails include required operational sections', () => {
  const source = read(guardrailsPath);
  [
    'Destructive Migration Freeze',
    'Allowed Recovery Moves',
    'Prohibited Recovery Moves',
    'Screen Cutover Approval Checklist',
  ].forEach((marker) => {
    assert.match(source, new RegExp(marker), `guardrails should include section: ${marker}`);
  });
});

void test('constitution clearly expresses additive intent rather than replacement intent', () => {
  const source = read(constitutionPath);
  assert.match(source, /not a replacement pass/i);
  assert.match(source, /additive/i);
  assert.match(source, /New art is generated primarily for missing support roles/i);
});
